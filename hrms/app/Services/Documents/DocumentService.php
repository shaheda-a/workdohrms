<?php

namespace App\Services\Documents;
use App\Services\Core\BaseService;

use App\Models\HrDocument;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Document Service
 *
 * Handles all business logic for HR document management.
 */
class DocumentService extends BaseService
{
    protected string $modelClass = HrDocument::class;

    protected array $defaultRelations = [
        'documentType',
        'staffMember',
    ];

    protected array $searchableFields = [
        'title',
        'description',
    ];

    protected array $filterableFields = [
        'document_type_id' => 'document_type_id',
        'staff_member_id' => 'staff_member_id',
    ];

    /**
     * Get all documents with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new document.
     */
    public function create(array $data): HrDocument
    {
        return HrDocument::create($data);
    }

    /**
     * Update a document.
     */
    public function update(int|HrDocument $document, array $data): HrDocument
    {
        if (is_int($document)) {
            $document = $this->findOrFail($document);
        }

        $document->update($data);

        return $document->fresh($this->defaultRelations);
    }

    /**
     * Delete a document.
     */
    public function delete(int|HrDocument $document): bool
    {
        if (is_int($document)) {
            $document = $this->findOrFail($document);
        }

        if ($document->file_path) {
            Storage::delete($document->file_path);
        }

        return $document->delete();
    }

    /**
     * Get documents by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get documents by type.
     */
    public function getByType(int $documentTypeId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('document_type_id', $documentTypeId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
