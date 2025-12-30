<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = DocumentType::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $types = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($types);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:document_types,title',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $type = DocumentType::create($validated);

        return $this->created($type, 'Document type created');
    }

    public function show(DocumentType $documentType)
    {
        return $this->success($documentType);
    }

    public function update(Request $request, DocumentType $documentType)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:document_types,title,'.$documentType->id,
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $documentType->update($validated);

        return $this->success($documentType->fresh(), 'Document type updated');
    }

    public function destroy(DocumentType $documentType)
    {
        if ($documentType->documents()->exists()) {
            return $this->error('Cannot delete type with existing documents', 422);
        }

        $documentType->delete();

        return $this->noContent('Document type deleted');
    }
}
