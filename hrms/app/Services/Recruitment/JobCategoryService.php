<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\JobCategory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Job Category Service
 *
 * Handles all business logic for job category management.
 */
class JobCategoryService extends BaseService
{
    protected string $modelClass = JobCategory::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'name',
    ];

    /**
     * Get all job categories.
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
     * Create a new job category.
     */
    public function create(array $data): JobCategory
    {
        return JobCategory::create($data);
    }

    /**
     * Update a job category.
     */
    public function update(int|JobCategory $category, array $data): JobCategory
    {
        if (is_int($category)) {
            $category = $this->findOrFail($category);
        }

        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete a job category.
     */
    public function delete(int|JobCategory $category): bool
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
