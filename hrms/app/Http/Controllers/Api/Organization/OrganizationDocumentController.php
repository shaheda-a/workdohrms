<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\OrganizationDocument;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OrganizationDocumentController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = OrganizationDocument::with(['documentType', 'author']);

        if ($request->filled('document_type_id')) {
            $query->where('document_type_id', $request->document_type_id);
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }

        $documents = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($documents);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'document_type_id' => 'required|exists:document_types,id',
            'file' => 'required|file|max:20480', // 20MB
            'notes' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $validated['file_path'] = $file->store('organization-documents', 'public');
        $validated['original_name'] = $file->getClientOriginalName();
        $validated['mime_type'] = $file->getMimeType();
        $validated['file_size'] = $file->getSize();
        $validated['author_id'] = $request->user()->id;

        $document = OrganizationDocument::create($validated);

        return $this->created($document->load('documentType'), 'Document uploaded');
    }

    public function show(OrganizationDocument $organizationDocument)
    {
        $data = $organizationDocument->load(['documentType', 'author'])->toArray();
        $data['file_size_formatted'] = $organizationDocument->file_size_formatted;

        return $this->success($data);
    }

    /**
     * Download the document.
     */
    public function download(OrganizationDocument $organizationDocument)
    {
        return Storage::disk('public')->download(
            $organizationDocument->file_path,
            $organizationDocument->original_name
        );
    }

    public function update(Request $request, OrganizationDocument $organizationDocument)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'document_type_id' => 'sometimes|required|exists:document_types,id',
            'file' => 'nullable|file|max:20480',
            'notes' => 'nullable|string',
        ]);

        if ($request->hasFile('file')) {
            Storage::disk('public')->delete($organizationDocument->file_path);

            $file = $request->file('file');
            $validated['file_path'] = $file->store('organization-documents', 'public');
            $validated['original_name'] = $file->getClientOriginalName();
            $validated['mime_type'] = $file->getMimeType();
            $validated['file_size'] = $file->getSize();
        }

        $organizationDocument->update($validated);

        return $this->success($organizationDocument->fresh('documentType'), 'Document updated');
    }

    public function destroy(OrganizationDocument $organizationDocument)
    {
        Storage::disk('public')->delete($organizationDocument->file_path);
        $organizationDocument->delete();

        return $this->noContent('Document deleted');
    }
}
