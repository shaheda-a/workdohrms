<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\RecurringDeduction;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Recurring Deduction Service
 *
 * Handles all business logic for recurring deduction management.
 */
class RecurringDeductionService extends BaseService
{
    protected string $modelClass = RecurringDeduction::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'deduction_type' => 'deduction_type',
    ];

    /**
     * Get all recurring deductions with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
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
     * Create a recurring deduction.
     */
    public function create(array $data): RecurringDeduction
    {
        $deduction = RecurringDeduction::create($data);

        return $deduction->load($this->defaultRelations);
    }

    /**
     * Update a recurring deduction.
     */
    public function update(int|RecurringDeduction $deduction, array $data): RecurringDeduction
    {
        if (is_int($deduction)) {
            $deduction = $this->findOrFail($deduction);
        }

        $deduction->update($data);

        return $deduction->fresh($this->defaultRelations);
    }

    /**
     * Delete a recurring deduction.
     */
    public function delete(int|RecurringDeduction $deduction): bool
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
            ->get();
    }
}
