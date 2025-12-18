<?php

namespace App\Services\Documents;
use App\Services\Core\BaseService;

use App\Models\DocumentCategory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Document Category Service
 *
 * Handles all business logic for document category management.
 */
class DocumentCategoryService extends BaseService
{
    protected string $modelClass = DocumentCategory::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'name',
    ];

    /**
     * Get all document categories.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query();

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
     * Create a new document category.
     */
    public function create(array $data): DocumentCategory
    {
        return DocumentCategory::create($data);
    }

    /**
     * Update a document category.
     */
    public function update(int|DocumentCategory $category, array $data): DocumentCategory
    {
        if (is_int($category)) {
            $category = $this->findOrFail($category);
        }

        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete a document category.
     */
    public function delete(int|DocumentCategory $category): bool
    {
        if (is_int($category)) {
            $category = $this->findOrFail($category);
        }

        return $category->delete();
    }

    /**
     * Get categories for dropdown.
     */
    public function getForDropdown(): Collection
    {
        return $this->query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }
}
