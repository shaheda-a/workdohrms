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
    // 1. LOCAL STORAGE
    // ==========================================
    public function uploadLocal(Request $request)
    {
        return $this->handleUpload($request, 'local');
    }

    // ==========================================
    // 2. WASABI STORAGE
    // ==========================================
    public function uploadWasabi(Request $request)
    {
        return $this->handleUpload($request, 'wasabi');
    }

    // ==========================================
    // 3. AWS STORAGE
    // ==========================================
    public function uploadAws(Request $request)
    {
        return $this->handleUpload($request, 'aws');
    }

    // ==========================================
    // SHARED CRUD
    // ==========================================

    /**
     * List All Documents
     */
    public function index()
    {
        try {
            $documents = $this->documentService->getAllDocuments();
            return response()->json(['success' => true, 'data' => $documents]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get Single Document & URL
     */
    public function show($id)
    {
        try {
            $document = $this->documentService->getDocument($id);
            if (!$document) return response()->json(['success' => false, 'message' => 'Not Found'], 404);

            $url = $this->documentService->getDocumentUrl($document);

            return response()->json([
                'success' => true, 
                'data' => $document,
                'url' => $url
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update Metadata (Name, Type)
     */
    public function update(Request $request, $id)
    {
         $validator = Validator::make($request->all(), [
            'document_name' => 'sometimes|string|max:255',
            'document_type_id' => 'sometimes|exists:document_types,id',
        ]);

        if ($validator->fails()) return response()->json(['success'=>false, 'errors'=>$validator->errors()], 422);

        try {
            $doc = $this->documentService->updateDocumentMetadata($id, $request->all());
            return response()->json(['success' => true, 'message'=>'Updated', 'data' => $doc]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete Document (and file from storage)
     */
    public function destroy($id)
    {
        try {
            $this->documentService->deleteDocument($id);
            return response()->json(['success' => true, 'message' => 'Document deleted']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
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
