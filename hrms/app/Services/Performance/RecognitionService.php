<?php

namespace App\Services\Performance;
use App\Services\Core\BaseService;

use App\Models\RecognitionCategory;
use App\Models\RecognitionRecord;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Recognition Service
 *
 * Handles all business logic for employee recognition management.
 */
class RecognitionService extends BaseService
{
    protected string $modelClass = RecognitionRecord::class;

    protected array $defaultRelations = [
        'staffMember',
        'category',
        'givenBy',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'recognition_category_id' => 'category_id',
    ];

    /**
     * Get all recognition records with filtering and pagination.
     */
    public function getAllRecords(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a recognition record.
     */
    public function createRecord(array $data, ?int $givenById = null): RecognitionRecord
    {
        $data['given_by'] = $givenById ?? $data['given_by'] ?? null;
        $record = RecognitionRecord::create($data);

        return $record->load($this->defaultRelations);
    }

    /**
     * Update a recognition record.
     */
    public function updateRecord(int $id, array $data): RecognitionRecord
    {
        $record = RecognitionRecord::findOrFail($id);
        $record->update($data);

        return $record->fresh($this->defaultRelations);
    }

    /**
     * Delete a recognition record.
     */
    public function deleteRecord(int $id): bool
    {
        return RecognitionRecord::findOrFail($id)->delete();
    }

    /**
     * Get recognitions by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    // ========================================
    // RECOGNITION CATEGORIES
    // ========================================

    /**
     * Get all recognition categories.
     */
    public function getAllCategories(array $params = []): LengthAwarePaginator|Collection
    {
        $query = RecognitionCategory::query();

        $query->orderBy('name');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a recognition category.
     */
    public function createCategory(array $data): RecognitionCategory
    {
        return RecognitionCategory::create($data);
    }

    /**
     * Update a recognition category.
     */
    public function updateCategory(int $id, array $data): RecognitionCategory
    {
        $category = RecognitionCategory::findOrFail($id);
        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete a recognition category.
     */
    public function deleteCategory(int $id): bool
    {
        return RecognitionCategory::findOrFail($id)->delete();
    }

    /**
     * Get categories for dropdown.
     */
    public function getCategoriesForDropdown(): Collection
    {
        return RecognitionCategory::select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }
}
