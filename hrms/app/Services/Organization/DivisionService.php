<?php

namespace App\Services\Organization;
use App\Services\Core\BaseService;

use App\Models\Division;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Division Service
 *
 * Handles all business logic for division/department management.
 */
class DivisionService extends BaseService
{
    protected string $modelClass = Division::class;

    protected array $defaultRelations = [
        'officeLocation',
        'manager',
    ];

    protected array $searchableFields = [
        'name',
        'code',
    ];

    protected array $filterableFields = [
        'office_location_id' => 'office_location_id',
    ];

    /**
     * Get all divisions with filtering and pagination.
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
     * Create a division.
     */
    public function create(array $data): Division
    {
        $division = Division::create($data);

        return $division->load($this->defaultRelations);
    }

    /**
     * Update a division.
     */
    public function update(int|Division $division, array $data): Division
    {
        if (is_int($division)) {
            $division = $this->findOrFail($division);
        }

        $division->update($data);

        return $division->fresh($this->defaultRelations);
    }

    /**
     * Delete a division.
     */
    public function delete(int|Division $division): bool
    {
        if (is_int($division)) {
            $division = $this->findOrFail($division);
        }

        return $division->delete();
    }

    /**
     * Get divisions by office location.
     */
    public function getByOfficeLocation(int $officeLocationId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('office_location_id', $officeLocationId)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get divisions for dropdown.
     */
    public function getForDropdown(?int $officeLocationId = null): Collection
    {
        $query = $this->query()->select(['id', 'name', 'office_location_id']);

        if ($officeLocationId) {
            $query->where('office_location_id', $officeLocationId);
        }

        return $query->orderBy('name')->get();
    }
}
