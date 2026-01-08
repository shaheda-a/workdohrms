<?php

namespace App\Services\Attendance;

use App\Models\StaffMember;
use App\Models\WorkLog;
use App\Services\Core\BaseService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Attendance Service
 *
 * Handles all business logic for attendance/work log management.
 */
class AttendanceService extends BaseService
{
    protected string $modelClass = WorkLog::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'office_location_id' => 'office_location_id',
    ];

/**
 * Get attendance records with filters.
 */
public function getAll(array $params = []): \Illuminate\Pagination\LengthAwarePaginator|\Illuminate\Support\Collection
{
    $query = $this->query()->with($this->defaultRelations);

    $query = $this->applyFilters($query, $params);

    // Date filter
    if (! empty($params['date'])) {
        $query->whereDate('log_date', $params['date']);
    }

    // Date range filter
    if (! empty($params['start_date'])) {
        $query->whereDate('log_date', '>=', $params['start_date']);
    }
    if (! empty($params['end_date'])) {
        $query->whereDate('log_date', '<=', $params['end_date']);
    }

    // Month/Year filter
    if (! empty($params['month']) && ! empty($params['year'])) {
        $query->whereMonth('log_date', $params['month'])
            ->whereYear('log_date', $params['year']);
    }

    $query = $this->applyOrdering($query, ['order_by' => 'log_date', 'order' => 'desc']);

    $paginate = $params['paginate'] ?? true;
    $perPage = $params['per_page'] ?? $this->perPage;

    $result = $paginate
        ? $query->paginate($perPage)
        : $query->get();

    // Format the clock_in and clock_out times to show only time (H:i:s)
    $transformFunc = function ($workLog) {
        if ($workLog->clock_in instanceof \Carbon\Carbon) {
            $workLog->clock_in = $workLog->clock_in->format('H:i:s');
        } elseif (is_string($workLog->clock_in)) {
            try {
                $workLog->clock_in = \Carbon\Carbon::parse($workLog->clock_in)->format('H:i:s');
            } catch (\Exception $e) {
                // Keep original if parsing fails
            }
        }

        if ($workLog->clock_out instanceof \Carbon\Carbon) {
            $workLog->clock_out = $workLog->clock_out->format('H:i:s');
        } elseif (is_string($workLog->clock_out)) {
            try {
                $workLog->clock_out = \Carbon\Carbon::parse($workLog->clock_out)->format('H:i:s');
            } catch (\Exception $e) {
                // Keep original if parsing fails
            }
        }

        return $workLog;
    };

    if ($paginate) {
        $result->getCollection()->transform($transformFunc);
    } else {
        $result->transform($transformFunc);
    }

    return $result;
}

    /**
     * Clock in for an employee.
     */
public function clockIn(int $staffMemberId, array $data = []): array
    {
        $today = now()->toDateString();

        // Check if already clocked in today
        $existing = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->first();

        if ($existing && !$existing->clock_out) {
            throw new \Exception('Already clocked in for today');
        }

        // If exists but clocked out, update clock in time
        if ($existing && $existing->clock_out) {
            $existing->update([
                'clock_in' => now(),
                'clock_in_ip' => $data['ip_address'] ?? null,
                'clock_out' => null,
                'total_hours' => null,
            ]);
        } else {
            // Create new work log
            $existing = WorkLog::create([
                'staff_member_id' => $staffMemberId,
                'log_date' => $today,
                'clock_in' => now(),
                'clock_in_ip' => $data['ip_address'] ?? null,
                'status' => 'present',
            ]);
        }

        // Return current status
        return $this->getCurrentStatus($staffMemberId);
    }

    /**
     * Clock out for an employee.
     */
public function clockOut(int $staffMemberId, array $data = []): array
    {
        $today = now()->toDateString();

        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', $today)
            ->whereNull('clock_out')
            ->first();

        if (! $workLog) {
            throw new \Exception('No active clock-in found for today');
        }

        $clockIn = Carbon::parse($workLog->clock_in);
        $clockOut = now();
        $workedMinutes = $clockIn->diffInMinutes($clockOut);

        $workLog->update([
            'clock_out' => $clockOut,
            'clock_out_ip' => $data['ip_address'] ?? null,
            'clock_out_location' => $data['location'] ?? null,
            'total_hours' => round($workedMinutes / 60, 2),
        ]);

        // Return current status
        return $this->getCurrentStatus($staffMemberId);
    }

    /**
     * Get current status for employee.
     */
    public function getCurrentStatus(int $staffMemberId): array
    {
        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', now()->toDateString())
            ->first();

        if (! $workLog) {
            return [
                'status' => 'not_clocked_in',
                'clock_in' => null,
                'clock_out' => null,
                'total_hours' => null,
            ];
        }

        // Safely format times
        $formatTime = function($time) {
            if (!$time) {
                return null;
            }
            
            if (is_string($time)) {
                return $time;
            }
            
            if ($time instanceof \Carbon\Carbon || $time instanceof \DateTime) {
                return $time->format('H:i:s');
            }
            
            return (string) $time;
        };

        return [
            'status' => $workLog->clock_out ? 'clocked_out' : 'clocked_in',
            'clock_in' => $formatTime($workLog->clock_in),
            'clock_out' => $formatTime($workLog->clock_out),
            'total_hours' => $workLog->total_hours,
        ];
    }


    /**
     * Create or update attendance record (manual entry).
     */
    public function recordAttendance(array $data): WorkLog
    {
        return DB::transaction(function () use ($data) {
            $logDate = $data['log_date'] ?? $data['work_date'] ?? now()->toDateString();
            $existing = WorkLog::where('staff_member_id', $data['staff_member_id'])
                ->whereDate('log_date', $logDate)
                ->first();

            if ($existing) {
                $existing->update($data);

                return $existing->fresh($this->defaultRelations);
            }

            return WorkLog::create($data);
        });
    }

    /**
     * Bulk record attendance for multiple employees.
     */
    public function bulkRecordAttendance(array $records): Collection
    {
        return DB::transaction(function () use ($records) {
            $created = collect();

            foreach ($records as $record) {
                $created->push($this->recordAttendance($record));
            }

            return $created;
        });
    }

    /**
     * Get today's attendance summary.
     */
    public function getTodaySummary(): array
    {
        $today = now()->toDateString();
        $totalEmployees = StaffMember::active()->count();

        $present = WorkLog::whereDate('log_date', $today)->count();
        $absent = $totalEmployees - $present;
        $late = WorkLog::whereDate('log_date', $today)
            ->where('status', 'late')
            ->count();
        $halfDay = WorkLog::whereDate('log_date', $today)
            ->where('status', 'half_day')
            ->count();

        return [
            'date' => $today,
            'total_employees' => $totalEmployees,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'half_day' => $halfDay,
            'not_marked' => $absent,
            'attendance_percentage' => $totalEmployees > 0
                ? round(($present / $totalEmployees) * 100, 1)
                : 0,
        ];
    }

    /**
     * Get attendance summary for a date range.
     */
    public function getSummaryForDateRange(string $startDate, string $endDate, ?int $staffMemberId = null): array
    {
        $query = WorkLog::whereBetween('log_date', [$startDate, $endDate]);

        if ($staffMemberId) {
            $query->where('staff_member_id', $staffMemberId);
        }

        $records = $query->get();

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1,
            'present_days' => $records->count(),
            'late_days' => $records->where('status', 'late')->count(),
            'half_days' => $records->where('status', 'half_day')->count(),
            'total_hours' => $records->sum('total_hours'),
            'average_hours_per_day' => $records->count() > 0
                ? round($records->sum('total_hours') / $records->count(), 2)
                : 0,
        ];
    }

    /**
     * Get employee attendance for the month.
     */
    public function getEmployeeMonthlyAttendance(int $staffMemberId, int $month, int $year): array
    {
        $records = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereMonth('log_date', $month)
            ->whereYear('log_date', $year)
            ->orderBy('log_date')
            ->get();

        $startOfMonth = Carbon::create($year, $month, 1);
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        $workingDays = $this->countWorkingDays($startOfMonth, $endOfMonth);

        return [
            'month' => $month,
            'year' => $year,
            'working_days' => $workingDays,
            'present_days' => $records->count(),
            'absent_days' => $workingDays - $records->count(),
            'late_days' => $records->where('status', 'late')->count(),
            'total_hours' => $records->sum('total_hours'),
            'records' => $records,
        ];
    }

    /**
     * Get attendance report for all employees.
     */
    public function getAttendanceReport(array $params = []): Collection
    {
        $startDate = $params['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? now()->endOfMonth()->toDateString();

        $employees = StaffMember::active()
            ->with(['officeLocation', 'division', 'jobTitle'])
            ->get();

        return $employees->map(function ($employee) use ($startDate, $endDate) {
            $summary = $this->getSummaryForDateRange($startDate, $endDate, $employee->id);

            return [
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'staff_code' => $employee->staff_code,
                    'department' => $employee->division?->title,
                ],
                'attendance' => $summary,
            ];
        });
    }

    /**
     * Check if employee has clocked in today.
     */
    public function hasClockedInToday(int $staffMemberId): bool
    {
        return WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('log_date', now()->toDateString())
            ->exists();
    }

    /**
     * Count working days between dates (excludes weekends).
     */
    protected function countWorkingDays(Carbon $start, Carbon $end): int
    {
        $days = 0;
        $current = $start->copy();

        while ($current <= $end) {
            if (! $current->isWeekend()) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }
}
