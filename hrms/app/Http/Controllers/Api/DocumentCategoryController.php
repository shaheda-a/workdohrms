<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DocumentCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = DocumentCategory::with('parent');

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->parent_id) {
            $query->where('parent_id', $request->parent_id);
        }

        if ($request->active_only) {
            $query->where('is_active', true);
        }

        $categories = $request->paginate === 'false' 
            ? $query->get() 
            : $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:document_categories,id',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = DocumentCategory::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Document category created successfully',
            'data' => $category
        ], 201);
    }

    public function show(DocumentCategory $documentCategory)
    {
        $documentCategory->load(['parent', 'children', 'documents']);
        return response()->json([
            'success' => true,
            'data' => $documentCategory
        ]);
    }

    public function update(Request $request, DocumentCategory $documentCategory)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:document_categories,id',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $documentCategory->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Document category updated successfully',
            'data' => $documentCategory
        ]);
    }

    public function destroy(DocumentCategory $documentCategory)
    {
        $documentCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document category deleted successfully'
        ]);
    }
}
