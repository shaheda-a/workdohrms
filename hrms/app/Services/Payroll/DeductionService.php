<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\Deduction;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Deduction Service
 *
 * Handles all business logic for payroll deduction management.
 */
class DeductionService extends BaseService
{
    protected string $modelClass = Deduction::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $searchableFields = [
        'name',
        'description',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'deduction_type' => 'deduction_type',
    ];

    /**
     * Get all deductions with filtering and pagination.
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
     * Create a deduction.
     */
    public function create(array $data): Deduction
    {
        $deduction = Deduction::create($data);

        return $deduction->load($this->defaultRelations);
    }

    /**
     * Update a deduction.
     */
    public function update(int|Deduction $deduction, array $data): Deduction
    {
        if (is_int($deduction)) {
            $deduction = $this->findOrFail($deduction);
        }

        $deduction->update($data);

        return $deduction->fresh($this->defaultRelations);
    }

    /**
     * Delete a deduction.
     */
    public function delete(int|Deduction $deduction): bool
    {
        if (is_int($deduction)) {
            $deduction = $this->findOrFail($deduction);
        }

        return $deduction->delete();
    }

    /**
     * Get deductions by employee.
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
