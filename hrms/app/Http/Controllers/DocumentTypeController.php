<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\DocumentTypeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;
use App\Enums\DocumentOwnerType;
use Illuminate\Validation\Rules\Enum;

class DocumentTypeController extends Controller
{
    protected $documentTypeService;

    public function __construct(DocumentTypeService $documentTypeService)
    {
        $this->documentTypeService = $documentTypeService;
    }

    /**
     * List all Document Types with pagination, search, and ordering
     */
    public function index(Request $request)
    {
        try {
            $types = $this->documentTypeService->getAllDocumentTypes($request->all());
            return response()->json(['success' => true, 'data' => $types->items(), 'meta' => [
                'current_page' => $types->currentPage(),
                'per_page' => $types->perPage(),
                'total' => $types->total(),
                'total_pages' => $types->lastPage(),
            ]]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create Document Type
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255|unique:document_types,title',
            'notes' => 'nullable|string',
            'owner_type' => ['required', new Enum(DocumentOwnerType::class)], // Validates against 'employee', 'company', etc.
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $type = $this->documentTypeService->createDocumentType($request->all());
            return response()->json(['success' => true, 'message' => 'Created successfully', 'data' => $type], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Show Document Type
     */
    public function show($id)
    {
        try {
            $type = $this->documentTypeService->getDocumentType($id);
            if (!$type) return response()->json(['success' => false, 'message' => 'Not Found'], 404);
            return response()->json(['success' => true, 'data' => $type]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update Document Type
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255|unique:document_types,title,'.$id,
            'notes' => 'nullable|string',
            'owner_type' => ['sometimes', new Enum(DocumentOwnerType::class)],
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $type = $this->documentTypeService->updateDocumentType($id, $request->all());
             return response()->json(['success' => true, 'message' => 'Updated successfully', 'data' => $type]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete Document Type
     */
    public function destroy($id)
    {
        try {
            $this->documentTypeService->deleteDocumentType($id);
            return response()->json(['success' => true, 'message' => 'Deleted successfully']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
