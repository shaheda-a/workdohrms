<?php

namespace App\Services\Leave;
use App\Services\Core\BaseService;

use App\Models\TimeOffCategory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Time Off Category Service
 *
 * Handles all business logic for leave/time-off category management.
 */
class TimeOffCategoryService extends BaseService
{
    protected string $modelClass = TimeOffCategory::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'name',
    ];

    /**
     * Get all time off categories.
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
     * Create a new time off category.
     */
    public function create(array $data): TimeOffCategory
    {
        return TimeOffCategory::create($data);
    }

    /**
     * Update a time off category.
     */
    public function update(int|TimeOffCategory $category, array $data): TimeOffCategory
    {
        if (is_int($category)) {
            $category = $this->findOrFail($category);
        }

        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete a time off category.
     */
    public function delete(int|TimeOffCategory $category): bool
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
            ->select(['id', 'name', 'annual_allowance'])
            ->orderBy('name')
            ->get();
    }
}
