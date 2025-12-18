<?php

namespace App\Services\Documents;
use App\Services\Core\BaseService;

use App\Models\FileCategory;
use App\Models\HrDocument;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * HR Document Service
 *
 * Handles all business logic for HR document management.
 */
class HrDocumentService extends BaseService
{
    protected string $modelClass = HrDocument::class;

    protected array $defaultRelations = [
        'staffMember',
        'fileCategory',
        'uploadedBy',
    ];

    protected array $searchableFields = [
        'title',
        'description',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'file_category_id' => 'file_category_id',
    ];

    /**
     * Get all HR documents with filtering and pagination.
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
     * Create an HR document.
     */
    public function create(array $data): HrDocument
    {
        $document = HrDocument::create($data);

        return $document->load($this->defaultRelations);
    }

    /**
     * Update an HR document.
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
     * Delete an HR document.
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
     * Get documents by category.
     */
    public function getByCategory(int $categoryId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('file_category_id', $categoryId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    // ========================================
    // FILE CATEGORIES
    // ========================================

    /**
     * Get all file categories.
     */
    public function getAllCategories(): Collection
    {
        return FileCategory::orderBy('name')->get();
    }

    /**
     * Create a file category.
     */
    public function createCategory(array $data): FileCategory
    {
        return FileCategory::create($data);
    }

    /**
     * Update a file category.
     */
    public function updateCategory(int $id, array $data): FileCategory
    {
        $category = FileCategory::findOrFail($id);
        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete a file category.
     */
    public function deleteCategory(int $id): bool
    {
        return FileCategory::findOrFail($id)->delete();
    }

    /**
     * Get categories for dropdown.
     */
    public function getCategoriesForDropdown(): Collection
    {
        return FileCategory::select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }
}
