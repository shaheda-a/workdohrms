<?php

namespace App\Services;

use App\Models\WorkLog;
use App\Models\StaffMember;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
        if (!empty($params['date'])) {
            $query->whereDate('work_date', $params['date']);
        }

        // Date range filter
        if (!empty($params['start_date'])) {
            $query->whereDate('work_date', '>=', $params['start_date']);
        }
        if (!empty($params['end_date'])) {
            $query->whereDate('work_date', '<=', $params['end_date']);
        }

        // Month/Year filter
        if (!empty($params['month']) && !empty($params['year'])) {
            $query->whereMonth('work_date', $params['month'])
                  ->whereYear('work_date', $params['year']);
        }

        $query = $this->applyOrdering($query, ['order_by' => 'work_date', 'order' => 'desc']);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate 
            ? $query->paginate($perPage) 
            : $query->get();
    }

    /**
     * Clock in for an employee.
     */
    public function clockIn(int $staffMemberId, array $data = []): WorkLog
    {
        $today = now()->toDateString();
        
        // Check if already clocked in today
        $existing = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('work_date', $today)
            ->first();

        if ($existing) {
            throw new \Exception('Already clocked in for today');
        }

        return WorkLog::create([
            'staff_member_id' => $staffMemberId,
            'work_date' => $today,
            'clock_in' => now(),
            'clock_in_ip' => $data['ip_address'] ?? null,
            'clock_in_location' => $data['location'] ?? null,
            'status' => 'present',
        ]);
    }

    /**
     * Clock out for an employee.
     */
    public function clockOut(int $staffMemberId, array $data = []): WorkLog
    {
        $today = now()->toDateString();
        
        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('work_date', $today)
            ->whereNull('clock_out')
            ->first();

        if (!$workLog) {
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

        return $workLog->fresh($this->defaultRelations);
    }

    /**
     * Create or update attendance record (manual entry).
     */
    public function recordAttendance(array $data): WorkLog
    {
        return DB::transaction(function () use ($data) {
            $existing = WorkLog::where('staff_member_id', $data['staff_member_id'])
                ->whereDate('work_date', $data['work_date'])
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

        $present = WorkLog::whereDate('work_date', $today)->count();
        $absent = $totalEmployees - $present;
        $late = WorkLog::whereDate('work_date', $today)
            ->where('status', 'late')
            ->count();
        $halfDay = WorkLog::whereDate('work_date', $today)
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
        $query = WorkLog::whereBetween('work_date', [$startDate, $endDate]);

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
            ->whereMonth('work_date', $month)
            ->whereYear('work_date', $year)
            ->orderBy('work_date')
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
    public function hasClonedInToday(int $staffMemberId): bool
    {
        return WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('work_date', now()->toDateString())
            ->exists();
    }

    /**
     * Get current status for employee.
     */
    public function getCurrentStatus(int $staffMemberId): ?array
    {
        $workLog = WorkLog::where('staff_member_id', $staffMemberId)
            ->whereDate('work_date', now()->toDateString())
            ->first();

        if (!$workLog) {
            return [
                'status' => 'not_clocked_in',
                'clock_in' => null,
                'clock_out' => null,
            ];
        }

        return [
            'status' => $workLog->clock_out ? 'clocked_out' : 'clocked_in',
            'clock_in' => $workLog->clock_in,
            'clock_out' => $workLog->clock_out,
            'total_hours' => $workLog->total_hours,
        ];
    }

    /**
     * Count working days between dates (excludes weekends).
     */
    protected function countWorkingDays(Carbon $start, Carbon $end): int
    {
        $days = 0;
        $current = $start->copy();

        while ($current <= $end) {
            if (!$current->isWeekend()) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }
}
