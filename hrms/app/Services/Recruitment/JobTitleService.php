<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\JobTitle;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Job Title Service
 *
 * Handles all business logic for job title/designation management.
 */
class JobTitleService extends BaseService
{
    protected string $modelClass = JobTitle::class;

    protected array $defaultRelations = [
        'division',
    ];

    protected array $searchableFields = [
        'name',
        'code',
    ];

    protected array $filterableFields = [
        'division_id' => 'division_id',
    ];

    /**
     * Get all job titles with filtering and pagination.
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
     * Create a job title.
     */
    public function create(array $data): JobTitle
    {
        $jobTitle = JobTitle::create($data);

        return $jobTitle->load($this->defaultRelations);
    }

    /**
     * Update a job title.
     */
    public function update(int|JobTitle $jobTitle, array $data): JobTitle
    {
        if (is_int($jobTitle)) {
            $jobTitle = $this->findOrFail($jobTitle);
        }

        $jobTitle->update($data);

        return $jobTitle->fresh($this->defaultRelations);
    }

    /**
     * Delete a job title.
     */
    public function delete(int|JobTitle $jobTitle): bool
    {
        if (is_int($jobTitle)) {
            $jobTitle = $this->findOrFail($jobTitle);
        }

        return $jobTitle->delete();
    }

    /**
     * Get job titles by division.
     */
    public function getByDivision(int $divisionId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('division_id', $divisionId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get job titles for dropdown.
     */
    public function getForDropdown(?int $divisionId = null): Collection
    {
        $query = $this->query()->select(['id', 'name', 'division_id']);

        if ($divisionId) {
            $query->where('division_id', $divisionId);
        }

        return $query->orderBy('name')->get();
    }
}
