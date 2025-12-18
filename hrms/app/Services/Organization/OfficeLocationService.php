<?php

namespace App\Services\Organization;
use App\Services\Core\BaseService;

use App\Models\OfficeLocation;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Office Location Service
 *
 * Handles all business logic for office location management.
 */
class OfficeLocationService extends BaseService
{
    protected string $modelClass = OfficeLocation::class;

    protected array $defaultRelations = [
        'divisions',
    ];

    protected array $searchableFields = [
        'name',
        'address',
        'city',
    ];

    /**
     * Get all office locations with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

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
     * Create an office location.
     */
    public function create(array $data): OfficeLocation
    {
        $location = OfficeLocation::create($data);

        return $location->load($this->defaultRelations);
    }

    /**
     * Update an office location.
     */
    public function update(int|OfficeLocation $location, array $data): OfficeLocation
    {
        if (is_int($location)) {
            $location = $this->findOrFail($location);
        }

        $location->update($data);

        return $location->fresh($this->defaultRelations);
    }

    /**
     * Delete an office location.
     */
    public function delete(int|OfficeLocation $location): bool
    {
        if (is_int($location)) {
            $location = $this->findOrFail($location);
        }

        return $location->delete();
    }

    /**
     * Get locations for dropdown.
     */
    public function getForDropdown(): Collection
    {
        return $this->query()
            ->select(['id', 'name', 'city'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get location with divisions and job titles.
     */
    public function getWithHierarchy(int $id): OfficeLocation
    {
        return $this->query()
            ->with(['divisions.jobTitles'])
            ->findOrFail($id);
    }
}
