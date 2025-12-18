<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\Allowance;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Allowance Service
 *
 * Handles all business logic for payroll allowance management.
 */
class AllowanceService extends BaseService
{
    protected string $modelClass = Allowance::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $searchableFields = [
        'name',
        'description',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'allowance_type' => 'allowance_type',
    ];

    /**
     * Get all allowances with filtering and pagination.
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
     * Create an allowance.
     */
    public function create(array $data): Allowance
    {
        $allowance = Allowance::create($data);

        return $allowance->load($this->defaultRelations);
    }

    /**
     * Update an allowance.
     */
    public function update(int|Allowance $allowance, array $data): Allowance
    {
        if (is_int($allowance)) {
            $allowance = $this->findOrFail($allowance);
        }

        $allowance->update($data);

        return $allowance->fresh($this->defaultRelations);
    }

    /**
     * Delete an allowance.
     */
    public function delete(int|Allowance $allowance): bool
    {
        if (is_int($allowance)) {
            $allowance = $this->findOrFail($allowance);
        }

        return $allowance->delete();
    }

    /**
     * Get allowances by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
