<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\DocumentService;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;
use App\Enums\DocumentOwnerType;
use Illuminate\Validation\Rules\Enum;

class DocumentController extends Controller
{
    protected $documentService;

    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }

    // ==========================================
    // UNIFIED UPLOAD - AUTO LOCATION DETECTION
    // ==========================================

    /**
     * Upload Document - Automatically determines storage based on org/company
     * SINGLE API for all uploads
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:20480', // 20MB
            'document_type_id' => 'required|exists:document_types,id',
            'owner_type' => ['required', new Enum(DocumentOwnerType::class)],
            'owner_id' => 'required|integer',
            'document_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get authenticated user
            $user = auth()->user();

            // Prepare data with org_id and company_id from authenticated user
            $data = $request->all();
            $data['org_id'] = $user->org_id ?? null;
            $data['company_id'] = $user->company_id ?? null;

            // Upload document
            $document = $this->documentService->uploadDocument(
                $request->file('file'),
                $data
            );

            $location = $document->location;
            $storageTypeName = match ($location->location_type) {
                1 => 'Local',
                2 => 'Wasabi',
                3 => 'AWS S3',
                default => 'Unknown'
            };

            return response()->json([
                'success' => true,
                'message' => "Document uploaded to {$storageTypeName} successfully",
                'data' => $document,
                'storage_info' => [
                    'type' => $storageTypeName,
                    'location_id' => $location->id,
                    'org_id' => $location->org_id,
                    'company_id' => $location->company_id
                ],
                'user_context' => [
                    'org_id' => $user->org_id ?? null,
                    'company_id' => $user->company_id ?? null
                ]
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List All Documents with Pagination and Filters
     * Automatically filters by authenticated user's org_id and company_id
     */
    public function index(Request $request)
    {
        try {
            // Get authenticated user
            $user = auth()->user();

            // Get filters from request
            $filters = $request->only([
                'owner_type',
                'owner_id',
                'document_type_id',
                'location_type',
                'search',
                'date_from',
                'date_to',
                'sort_by',
                'sort_order'
            ]);

            // Auto-apply org_id and company_id from authenticated user
            $filters['org_id'] = $user->org_id ?? null;
            $filters['company_id'] = $user->company_id ?? null;

            $perPage = $request->input('per_page', 15);

            $documents = $this->documentService->getAllDocuments($filters, $perPage);

            // Check if paginated or collection
            $items = method_exists($documents, 'items') ? $documents->items() : $documents->all();

            // Generate temporary URLs for each document
            $documentsWithUrls = collect($items)->map(function ($document) {
                $url = null;

                if ($document->location) {
                    try {
                        $url = $this->documentService->getDocumentUrl($document);
                    } catch (Exception $e) {
                        \Log::error("Failed to generate URL for document {$document->id}: " . $e->getMessage());
                    }
                }

                return array_merge($document->toArray(), [
                    'temporary_url' => $url,
                    'storage_type' => match ($document->location->location_type ?? 0) {
                        1 => 'Local',
                        2 => 'Wasabi',
                        3 => 'AWS S3',
                        default => 'Unknown'
                    }
                ]);
            });

            // Build response
            $response = [
                'success' => true,
                'data' => $documentsWithUrls,
                'user_context' => [
                    'org_id' => $user->org_id ?? null,
                    'company_id' => $user->company_id ?? null
                ]
            ];

            // Add pagination if available
            if (method_exists($documents, 'total')) {
                $response['pagination'] = [
                    'total' => $documents->total(),
                    'per_page' => $documents->perPage(),
                    'current_page' => $documents->currentPage(),
                    'last_page' => $documents->lastPage(),
                    'from' => $documents->firstItem(),
                    'to' => $documents->lastItem()
                ];
            }

            return response()->json($response);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Single Document with Full Details & Temporary URL
     * Automatically filters by authenticated user's org_id and company_id
     */
    public function show(Request $request, $id)
    {
        try {
            // Get authenticated user
            $user = auth()->user();

            // Auto-apply org_id and company_id from authenticated user
            $filters = [
                'org_id' => $user->org_id ?? null,
                'company_id' => $user->company_id ?? null
            ];

            $document = $this->documentService->getDocument($id, $filters);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found or access denied'
                ], 404);
            }

            // Generate temporary URL based on storage type
            $url = null;
            $urlExpiry = null;

            if ($document->location) {
                $storageType = $document->location->location_type;

                if ($storageType === 1) {
                    // Local: Generate public URL
                    $url = $this->documentService->getDocumentUrl($document);
                } elseif ($storageType === 2 || $storageType === 3) {
                    // Wasabi or AWS: Generate temporary presigned URL (60 minutes)
                    $url = $this->documentService->getDocumentUrl($document);
                    $urlExpiry = now()->addMinutes(60)->toIso8601String();
                }
            }

            // Get storage type info
            $storageTypeName = match ($document->location->location_type) {
                1 => 'Local',
                2 => 'Wasabi',
                3 => 'AWS S3',
                default => 'Unknown'
            };

            return response()->json([
                'success' => true,
                'data' => $document,
                'access' => [
                    'url' => $url,
                    'expires_at' => $urlExpiry,
                    'url_type' => $storageTypeName === 'Local' ? 'permanent' : 'temporary'
                ],
                'storage_info' => [
                    'type' => $storageTypeName,
                    'location_id' => $document->location->id,
                    'location_type' => $document->location->location_type,
                    'org_id' => $document->location->org_id,
                    'company_id' => $document->location->company_id
                ],
                'file_info' => [
                    'name' => $document->document_name,
                    'size' => $document->document_size,
                    'size_formatted' => $this->formatBytes($document->document_size),
                    'extension' => $document->document_extension,
                    'mime_type' => $document->mime_type
                ],
                'user_context' => [
                    'org_id' => $user->org_id ?? null,
                    'company_id' => $user->company_id ?? null
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update Metadata (Name, Type)
     * Automatically filters by authenticated user's org_id and company_id
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'document_name' => 'sometimes|string|max:255',
            'document_type_id' => 'sometimes|exists:document_types,id',
        ]);

        if ($validator->fails())
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);

        try {
            // Get authenticated user
            $user = auth()->user();

            // Auto-apply org_id and company_id from authenticated user
            $filters = [
                'org_id' => $user->org_id ?? null,
                'company_id' => $user->company_id ?? null
            ];

            $doc = $this->documentService->updateDocumentMetadata($id, $request->all(), $filters);
            return response()->json([
                'success' => true,
                'message' => 'Document updated successfully',
                'data' => $doc,
                'user_context' => [
                    'org_id' => $user->org_id ?? null,
                    'company_id' => $user->company_id ?? null
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $e->getCode() === 0 ? 500 : $e->getCode());
        }
    }

    /**
     * Download Document
     * Supports Local, Wasabi, and AWS S3 storage
     */
    public function download($id)
    {
        try {
            // Get authenticated user
            $user = auth()->user();

            // Auto-apply org_id and company_id from authenticated user
            $filters = [
                'org_id' => $user->org_id ?? null,
                'company_id' => $user->company_id ?? null
            ];

            $document = $this->documentService->getDocument($id, $filters);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found or access denied'
                ], 404);
            }

            // Download based on storage type
            $storageType = $document->location->location_type;

            if ($storageType === 1) {
                // Local: Direct download
                return $this->documentService->downloadDocument($document);
            } elseif ($storageType === 2 || $storageType === 3) {
                // Wasabi or AWS: Redirect to presigned URL
                $temporaryUrl = $this->documentService->getDocumentUrl($document);

                return response()->json([
                    'success' => true,
                    'message' => 'Download URL generated',
                    'download_url' => $temporaryUrl,
                    'expires_at' => now()->addMinutes(60)->toIso8601String(),
                    'storage_type' => $storageType === 2 ? 'Wasabi' : 'AWS S3'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Unsupported storage type'
            ], 400);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete Document (and file from storage)
     * Automatically filters by authenticated user's org_id and company_id
     */
    public function destroy($id)
    {
        try {
            // Get authenticated user
            $user = auth()->user();

            // Auto-apply org_id and company_id from authenticated user
            $filters = [
                'org_id' => $user->org_id ?? null,
                'company_id' => $user->company_id ?? null
            ];

            $this->documentService->deleteDocument($id, $filters);
            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully',
                'user_context' => [
                    'org_id' => $user->org_id ?? null,
                    'company_id' => $user->company_id ?? null
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $e->getCode() === 0 ? 500 : $e->getCode());
        }
    }

    // ==========================================
    // Private Helper
    // ==========================================
    private function handleUpload(Request $request, string $provider)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:20480', // 20MB
            'document_type_id' => 'required|exists:document_types,id',
            'owner_type' => ['required', new Enum(DocumentOwnerType::class)],
            'owner_id' => 'required|integer',
            'org_id' => 'nullable|exists:organizations,id',
            'company_id' => 'nullable|exists:companies,id',
            'user_id' => 'nullable|exists:users,id',
            'document_name' => 'nullable|string|max:255',
            'document_location_id' => 'nullable|exists:document_locations,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $document = $this->documentService->storeDocument(
                $request->file('file'),
                $request->all(),
                $provider // 'local', 'wasabi', or 'aws'
            );

            return response()->json([
                'success' => true,
                'message' => "Document uploaded to {$provider} successfully",
                'data' => $document
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
