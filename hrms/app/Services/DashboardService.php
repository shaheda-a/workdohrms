<?php

namespace App\Services;

use App\Models\StaffMember;
use App\Models\WorkLog;
use App\Models\TimeOffRequest;
use App\Models\SalarySlip;
use App\Models\CompanyEvent;
use App\Models\CompanyNotice;
use Carbon\Carbon;

/**
 * Dashboard Service
 * 
 * Aggregates data for dashboard displays and reporting.
 */
class DashboardService
{
    protected StaffMemberService $staffService;
    protected AttendanceService $attendanceService;
    protected LeaveService $leaveService;
    protected PayrollService $payrollService;

    public function __construct(
        StaffMemberService $staffService,
        AttendanceService $attendanceService,
        LeaveService $leaveService,
        PayrollService $payrollService
    ) {
        $this->staffService = $staffService;
        $this->attendanceService = $attendanceService;
        $this->leaveService = $leaveService;
        $this->payrollService = $payrollService;
    }

    /**
     * Get complete dashboard data.
     */
    public function getDashboardData(): array
    {
        return [
            'employees' => $this->getEmployeeStats(),
            'attendance' => $this->attendanceService->getTodaySummary(),
            'leave_requests' => $this->getLeaveStats(),
            'payroll' => $this->getPayrollStats(),
            'upcoming_birthdays' => $this->getUpcomingBirthdays(),
            'recent_activities' => $this->getRecentActivities(),
            'upcoming_events' => $this->getUpcomingEvents(),
            'announcements' => $this->getRecentAnnouncements(),
        ];
    }

    /**
     * Get employee statistics.
     */
    public function getEmployeeStats(): array
    {
        return $this->staffService->getStatistics();
    }

    /**
     * Get leave request statistics.
     */
    public function getLeaveStats(): array
    {
        return $this->leaveService->getStatistics();
    }

    /**
     * Get payroll statistics.
     */
    public function getPayrollStats(): array
    {
        $currentMonth = now()->month;
        $currentYear = now()->year;

        $monthlySlips = SalarySlip::where('salary_month', $currentMonth)
            ->where('salary_year', $currentYear)
            ->get();

        return [
            'total_salary' => $monthlySlips->sum('net_salary'),
            'processed' => $monthlySlips->where('status', 'paid')->count(),
            'pending' => $monthlySlips->where('status', 'generated')->count(),
        ];
    }

    /**
     * Get upcoming birthdays (next 30 days).
     */
    public function getUpcomingBirthdays(int $days = 30): array
    {
        $today = now();
        $employees = StaffMember::active()
            ->whereNotNull('birth_date')
            ->get()
            ->filter(function ($employee) use ($today, $days) {
                $birthday = Carbon::parse($employee->birth_date)->setYear($today->year);
                if ($birthday->lt($today)) {
                    $birthday->addYear();
                }
                return $birthday->diffInDays($today) <= $days;
            })
            ->sortBy(function ($employee) use ($today) {
                $birthday = Carbon::parse($employee->birth_date)->setYear($today->year);
                if ($birthday->lt($today)) {
                    $birthday->addYear();
                }
                return $birthday;
            })
            ->take(5)
            ->map(function ($employee) use ($today) {
                $birthday = Carbon::parse($employee->birth_date)->setYear($today->year);
                if ($birthday->lt($today)) {
                    $birthday->addYear();
                }
                return [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'date' => $birthday->format('M d'),
                    'avatar' => strtoupper(substr($employee->full_name, 0, 2)),
                ];
            })
            ->values();

        return $employees->toArray();
    }

    /**
     * Get recent activities.
     */
    public function getRecentActivities(int $limit = 10): array
    {
        $activities = [];

        // Recent leave requests
        $leaveRequests = TimeOffRequest::with('staffMember')
            ->latest()
            ->limit($limit)
            ->get();

        foreach ($leaveRequests as $request) {
            $activities[] = [
                'id' => 'leave_' . $request->id,
                'action' => 'Leave ' . ucfirst($request->status),
                'user' => $request->staffMember?->full_name ?? 'Unknown',
                'time' => $request->updated_at?->diffForHumans() ?? 'Recently',
                'type' => 'leave',
                'timestamp' => $request->updated_at,
            ];
        }

        // Recent staff additions
        $newStaff = StaffMember::latest()
            ->limit($limit)
            ->get();

        foreach ($newStaff as $staff) {
            $activities[] = [
                'id' => 'staff_' . $staff->id,
                'action' => 'New employee added',
                'user' => $staff->full_name,
                'time' => $staff->created_at?->diffForHumans() ?? 'Recently',
                'type' => 'employee',
                'timestamp' => $staff->created_at,
            ];
        }

        // Recent attendance
        $attendance = WorkLog::with('staffMember')
            ->whereDate('work_date', now())
            ->latest()
            ->limit($limit)
            ->get();

        foreach ($attendance as $log) {
            $activities[] = [
                'id' => 'attendance_' . $log->id,
                'action' => $log->clock_out ? 'Clocked out' : 'Clocked in',
                'user' => $log->staffMember?->full_name ?? 'Unknown',
                'time' => $log->clock_out 
                    ? Carbon::parse($log->clock_out)->diffForHumans()
                    : Carbon::parse($log->clock_in)->diffForHumans(),
                'type' => 'attendance',
                'timestamp' => $log->clock_out ?? $log->clock_in,
            ];
        }

        // Sort by timestamp and limit
        usort($activities, function ($a, $b) {
            return ($b['timestamp'] ?? now()) <=> ($a['timestamp'] ?? now());
        });

        return array_slice($activities, 0, $limit);
    }

    /**
     * Get upcoming events.
     */
    public function getUpcomingEvents(int $limit = 5): array
    {
        $events = CompanyEvent::where('start_datetime', '>=', now())
            ->orderBy('start_datetime')
            ->limit($limit)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'date' => Carbon::parse($event->start_datetime)->format('M d, h:i A'),
                ];
            });

        return $events->toArray();
    }

    /**
     * Get recent announcements.
     */
    public function getRecentAnnouncements(int $limit = 5): array
    {
        $notices = CompanyNotice::where('is_active', true)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($notice) {
                return [
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'content' => \Str::limit($notice->content, 100),
                ];
            });

        return $notices->toArray();
    }

    /**
     * Get employee growth trend (last 12 months).
     */
    public function getEmployeeGrowthTrend(): array
    {
        $data = [];
        
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = StaffMember::whereDate('hire_date', '<=', $date->endOfMonth())
                ->whereNull('deleted_at')
                ->count();
            
            $data[] = [
                'month' => $date->format('M'),
                'year' => $date->year,
                'count' => $count,
            ];
        }

        return $data;
    }

    /**
     * Get department distribution.
     */
    public function getDepartmentDistribution(): array
    {
        return StaffMember::active()
            ->selectRaw('division_id, COUNT(*) as count')
            ->with('division')
            ->groupBy('division_id')
            ->get()
            ->map(function ($item) {
                return [
                    'department' => $item->division?->title ?? 'Unassigned',
                    'count' => $item->count,
                ];
            })
            ->toArray();
    }
}
