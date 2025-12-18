<?php

namespace App\Services\Attendance;
use App\Services\Core\BaseService;

use App\Models\ExtraHoursRecord;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Extra Hours Service
 *
 * Handles all business logic for overtime/extra hours management.
 */
class ExtraHoursService extends BaseService
{
    protected string $modelClass = ExtraHoursRecord::class;

    protected array $defaultRelations = [
        'staffMember',
        'approvedBy',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all extra hours records with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('work_date', [$params['start_date'], $params['end_date']]);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an extra hours record.
     */
    public function create(array $data): ExtraHoursRecord
    {
        $data['status'] = $data['status'] ?? 'pending';
        $record = ExtraHoursRecord::create($data);

        return $record->load($this->defaultRelations);
    }

    /**
     * Update an extra hours record.
     */
    public function update(int|ExtraHoursRecord $record, array $data): ExtraHoursRecord
    {
        if (is_int($record)) {
            $record = $this->findOrFail($record);
        }

        $record->update($data);

        return $record->fresh($this->defaultRelations);
    }

    /**
     * Delete an extra hours record.
     */
    public function delete(int|ExtraHoursRecord $record): bool
    {
        if (is_int($record)) {
            $record = $this->findOrFail($record);
        }

        return $record->delete();
    }

    /**
     * Approve an extra hours record.
     */
    public function approve(int|ExtraHoursRecord $record, int $approvedById): ExtraHoursRecord
    {
        if (is_int($record)) {
            $record = $this->findOrFail($record);
        }

        $record->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $record->fresh($this->defaultRelations);
    }

    /**
     * Reject an extra hours record.
     */
    public function reject(int|ExtraHoursRecord $record, ?string $reason = null): ExtraHoursRecord
    {
        if (is_int($record)) {
            $record = $this->findOrFail($record);
        }

        $record->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $record->fresh($this->defaultRelations);
    }

    /**
     * Get records by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('work_date', 'desc')
            ->get();
    }

    /**
     * Get total extra hours for employee in date range.
     */
    public function getTotalHours(int $staffMemberId, string $startDate, string $endDate): float
    {
        return $this->query()
            ->where('staff_member_id', $staffMemberId)
            ->where('status', 'approved')
            ->whereBetween('work_date', [$startDate, $endDate])
            ->sum('hours');
    }
}
