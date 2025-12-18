<?php

namespace App\Services\Attendance;
use App\Services\Core\BaseService;

use App\Models\AttendanceRegularization;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Attendance Regularization Service
 *
 * Handles all business logic for attendance regularization requests.
 */
class AttendanceRegularizationService extends BaseService
{
    protected string $modelClass = AttendanceRegularization::class;

    protected array $defaultRelations = [
        'staffMember',
        'approvedBy',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all regularization requests with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('regularization_date', [$params['start_date'], $params['end_date']]);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a regularization request.
     */
    public function create(array $data): AttendanceRegularization
    {
        $data['status'] = $data['status'] ?? 'pending';
        $regularization = AttendanceRegularization::create($data);

        return $regularization->load($this->defaultRelations);
    }

    /**
     * Update a regularization request.
     */
    public function update(int|AttendanceRegularization $regularization, array $data): AttendanceRegularization
    {
        if (is_int($regularization)) {
            $regularization = $this->findOrFail($regularization);
        }

        $regularization->update($data);

        return $regularization->fresh($this->defaultRelations);
    }

    /**
     * Delete a regularization request.
     */
    public function delete(int|AttendanceRegularization $regularization): bool
    {
        if (is_int($regularization)) {
            $regularization = $this->findOrFail($regularization);
        }

        return $regularization->delete();
    }

    /**
     * Approve a regularization request.
     */
    public function approve(int|AttendanceRegularization $regularization, int $approvedById): AttendanceRegularization
    {
        if (is_int($regularization)) {
            $regularization = $this->findOrFail($regularization);
        }

        $regularization->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $regularization->fresh($this->defaultRelations);
    }

    /**
     * Reject a regularization request.
     */
    public function reject(int|AttendanceRegularization $regularization, ?string $reason = null): AttendanceRegularization
    {
        if (is_int($regularization)) {
            $regularization = $this->findOrFail($regularization);
        }

        $regularization->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $regularization->fresh($this->defaultRelations);
    }

    /**
     * Get requests by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('regularization_date', 'desc')
            ->get();
    }

    /**
     * Get pending requests.
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
