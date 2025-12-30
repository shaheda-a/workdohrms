<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\DocumentCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DocumentCategoryController extends Controller
{
    use ApiResponse;

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

        return $this->success($categories);
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
            return $this->validationError($validator->errors());
        }

        $category = DocumentCategory::create($request->all());

        return $this->created($category, 'Document category created successfully');
    }

    public function show(DocumentCategory $documentCategory)
    {
        $documentCategory->load(['parent', 'children', 'documents']);

        return $this->success($documentCategory);
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
            return $this->validationError($validator->errors());
        }

        $documentCategory->update($request->all());

        return $this->success($documentCategory, 'Document category updated successfully');
    }

    public function destroy(DocumentCategory $documentCategory)
    {
        $documentCategory->delete();

        return $this->noContent('Document category deleted successfully');
    }
}
