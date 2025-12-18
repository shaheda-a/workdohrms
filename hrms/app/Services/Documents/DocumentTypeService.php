<?php

namespace App\Services\Documents;
use App\Services\Core\BaseService;

use App\Models\DocumentType;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Document Type Service
 *
 * Handles all business logic for document type management.
 */
class DocumentTypeService extends BaseService
{
    protected string $modelClass = DocumentType::class;

    protected array $defaultRelations = [
        'category',
    ];

    protected array $searchableFields = [
        'name',
    ];

    protected array $filterableFields = [
        'document_category_id' => 'category_id',
    ];

    /**
     * Get all document types.
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
     * Create a new document type.
     */
    public function create(array $data): DocumentType
    {
        $type = DocumentType::create($data);

        return $type->load($this->defaultRelations);
    }

    /**
     * Update a document type.
     */
    public function update(int|DocumentType $type, array $data): DocumentType
    {
        if (is_int($type)) {
            $type = $this->findOrFail($type);
        }

        $type->update($data);

        return $type->fresh($this->defaultRelations);
    }

    /**
     * Delete a document type.
     */
    public function delete(int|DocumentType $type): bool
    {
        if (is_int($type)) {
            $type = $this->findOrFail($type);
        }

        return $type->delete();
    }

    /**
     * Get types for dropdown.
     */
    public function getForDropdown(): Collection
    {
        return $this->query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get types by category.
     */
    public function getByCategory(int $categoryId): Collection
    {
        return $this->query()
            ->where('document_category_id', $categoryId)
            ->orderBy('name')
            ->get();
    }
}
