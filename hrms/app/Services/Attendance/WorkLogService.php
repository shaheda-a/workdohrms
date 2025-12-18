<?php

namespace App\Services\Attendance;
use App\Services\Core\BaseService;

use App\Models\WorkLog;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Work Log Service
 *
 * Handles all business logic for work log/attendance management.
 */
class WorkLogService extends BaseService
{
    protected string $modelClass = WorkLog::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all work logs with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('log_date', [$params['start_date'], $params['end_date']]);
        }

        if (! empty($params['date'])) {
            $query->whereDate('log_date', $params['date']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Clock in.
     */
    public function clockIn(int $staffMemberId, ?string $ipAddress = null): WorkLog
    {
        $today = now()->toDateString();

        $existingLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->first();

        if ($existingLog) {
            throw new \Exception('Already clocked in for today');
        }

        return WorkLog::create([
            'staff_member_id' => $staffMemberId,
            'log_date' => $today,
            'clock_in' => now(),
            'clock_in_ip' => $ipAddress,
            'status' => 'present',
        ]);
    }

    /**
     * Clock out.
     */
    public function clockOut(int $staffMemberId, ?string $ipAddress = null): WorkLog
    {
        $today = now()->toDateString();

        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->first();

        if (! $workLog) {
            throw new \Exception('No clock in record found for today');
        }

        if ($workLog->clock_out) {
            throw new \Exception('Already clocked out for today');
        }

        $workLog->update([
            'clock_out' => now(),
            'clock_out_ip' => $ipAddress,
            'total_hours' => now()->diffInMinutes($workLog->clock_in) / 60,
        ]);

        return $workLog->fresh($this->defaultRelations);
    }

    /**
     * Create a work log manually.
     */
    public function create(array $data): WorkLog
    {
        $workLog = WorkLog::create($data);

        return $workLog->load($this->defaultRelations);
    }

    /**
     * Update a work log.
     */
    public function update(int|WorkLog $workLog, array $data): WorkLog
    {
        if (is_int($workLog)) {
            $workLog = $this->findOrFail($workLog);
        }

        $workLog->update($data);

        return $workLog->fresh($this->defaultRelations);
    }

    /**
     * Delete a work log.
     */
    public function delete(int|WorkLog $workLog): bool
    {
        if (is_int($workLog)) {
            $workLog = $this->findOrFail($workLog);
        }

        return $workLog->delete();
    }

    /**
     * Get today's log for employee.
     */
    public function getTodaysLog(int $staffMemberId): ?WorkLog
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', today())
            ->first();
    }

    /**
     * Get logs by employee for date range.
     */
    public function getByEmployee(int $staffMemberId, ?string $startDate = null, ?string $endDate = null): Collection
    {
        $query = $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId);

        if ($startDate && $endDate) {
            $query->whereBetween('log_date', [$startDate, $endDate]);
        }

        return $query->orderBy('log_date', 'desc')->get();
    }

    /**
     * Get attendance summary for employee.
     */
    public function getAttendanceSummary(int $staffMemberId, string $startDate, string $endDate): array
    {
        $logs = $this->query()
            ->where('staff_member_id', $staffMemberId)
            ->whereBetween('log_date', [$startDate, $endDate])
            ->get();

        return [
            'total_days' => $logs->count(),
            'present_days' => $logs->where('status', 'present')->count(),
            'absent_days' => $logs->where('status', 'absent')->count(),
            'late_days' => $logs->where('status', 'late')->count(),
            'half_days' => $logs->where('status', 'half_day')->count(),
            'leave_days' => $logs->where('status', 'leave')->count(),
            'total_hours' => $logs->sum('total_hours'),
        ];
    }
}
