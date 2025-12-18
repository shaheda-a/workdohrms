<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\SalaryAdvance;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Salary Advance Service
 *
 * Handles all business logic for salary advance management.
 */
class SalaryAdvanceService extends BaseService
{
    protected string $modelClass = SalaryAdvance::class;

    protected array $defaultRelations = [
        'staffMember',
        'approvedBy',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all salary advances with filtering and pagination.
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
     * Create a salary advance request.
     */
    public function create(array $data): SalaryAdvance
    {
        $data['status'] = $data['status'] ?? 'pending';
        $advance = SalaryAdvance::create($data);

        return $advance->load($this->defaultRelations);
    }

    /**
     * Update a salary advance.
     */
    public function update(int|SalaryAdvance $advance, array $data): SalaryAdvance
    {
        if (is_int($advance)) {
            $advance = $this->findOrFail($advance);
        }

        $advance->update($data);

        return $advance->fresh($this->defaultRelations);
    }

    /**
     * Delete a salary advance.
     */
    public function delete(int|SalaryAdvance $advance): bool
    {
        if (is_int($advance)) {
            $advance = $this->findOrFail($advance);
        }

        return $advance->delete();
    }

    /**
     * Approve a salary advance.
     */
    public function approve(int|SalaryAdvance $advance, int $approvedById): SalaryAdvance
    {
        if (is_int($advance)) {
            $advance = $this->findOrFail($advance);
        }

        $advance->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $advance->fresh($this->defaultRelations);
    }

    /**
     * Reject a salary advance.
     */
    public function reject(int|SalaryAdvance $advance, ?string $reason = null): SalaryAdvance
    {
        if (is_int($advance)) {
            $advance = $this->findOrFail($advance);
        }

        $advance->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $advance->fresh($this->defaultRelations);
    }

    /**
     * Mark as disbursed.
     */
    public function markDisbursed(int|SalaryAdvance $advance): SalaryAdvance
    {
        if (is_int($advance)) {
            $advance = $this->findOrFail($advance);
        }

        $advance->update([
            'status' => 'disbursed',
            'disbursed_at' => now(),
        ]);

        return $advance->fresh($this->defaultRelations);
    }

    /**
     * Get advances by employee.
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
     * Get pending advances.
     */
    public function getPending(): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->get();
    }
}
