<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Models\CompanyEvent;
use App\Models\CompanyNotice;
use App\Models\SalarySlip;
use App\Models\StaffMember;
use App\Models\TimeOffRequest;
use App\Models\WorkLog;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ApiResponse;

    /**
     * Monthly attendance report.
     */
    public function attendanceReport(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|date_format:Y-m',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'division_id' => 'nullable|exists:divisions,id',
            'staff_member_id' => 'nullable|exists:staff_members,id',
        ]);

        $period = Carbon::parse($validated['month'].'-01');
        $startDate = $period->copy()->startOfMonth();
        $endDate = $period->copy()->endOfMonth();

        $query = StaffMember::active();

        if (! empty($validated['office_location_id'])) {
            $query->where('office_location_id', $validated['office_location_id']);
        }
        if (! empty($validated['division_id'])) {
            $query->where('division_id', $validated['division_id']);
        }
        if (! empty($validated['staff_member_id'])) {
            $query->where('id', $validated['staff_member_id']);
        }

        $staffMembers = $query->get();
        $report = [];

        foreach ($staffMembers as $staff) {
            $logs = WorkLog::where('staff_member_id', $staff->id)
                ->forPeriod($startDate, $endDate)
                ->get();

            $report[] = [
                'staff_member' => [
                    'id' => $staff->id,
                    'staff_code' => $staff->staff_code,
                    'full_name' => $staff->full_name,
                ],
                'present_days' => $logs->where('status', 'present')->count(),
                'absent_days' => $logs->where('status', 'absent')->count(),
                'half_days' => $logs->where('status', 'half_day')->count(),
                'on_leave' => $logs->where('status', 'on_leave')->count(),
                'holidays' => $logs->where('status', 'holiday')->count(),
                'total_late_minutes' => $logs->sum('late_minutes'),
                'total_overtime_minutes' => $logs->sum('overtime_minutes'),
                'total_early_leave_minutes' => $logs->sum('early_leave_minutes'),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'period' => $validated['month'],
                'total_working_days' => $endDate->day,
                'report' => $report,
            ],
        ]);
    }

    /**
     * Leave report.
     */
    public function leaveReport(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
            'time_off_category_id' => 'nullable|exists:time_off_categories,id',
            'staff_member_id' => 'nullable|exists:staff_members,id',
        ]);

        $query = TimeOffRequest::with(['staffMember', 'category'])
            ->whereYear('start_date', $validated['year']);

        if (! empty($validated['month'])) {
            $query->whereMonth('start_date', $validated['month']);
        }
        if (! empty($validated['time_off_category_id'])) {
            $query->where('time_off_category_id', $validated['time_off_category_id']);
        }
        if (! empty($validated['staff_member_id'])) {
            $query->where('staff_member_id', $validated['staff_member_id']);
        }

        $requests = $query->get();

        $summary = [
            'total_requests' => $requests->count(),
            'approved' => $requests->where('approval_status', 'approved')->count(),
            'pending' => $requests->where('approval_status', 'pending')->count(),
            'declined' => $requests->where('approval_status', 'declined')->count(),
            'total_days_taken' => $requests->where('approval_status', 'approved')->sum('total_days'),
        ];

        // Group by category
        $byCategory = $requests->where('approval_status', 'approved')
            ->groupBy('time_off_category_id')
            ->map(function ($items, $categoryId) {
                $category = $items->first()->category;

                return [
                    'category_id' => $categoryId,
                    'category_title' => $category?->title,
                    'count' => $items->count(),
                    'total_days' => $items->sum('total_days'),
                ];
            })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'year' => $validated['year'],
                'month' => $validated['month'] ?? 'all',
                'summary' => $summary,
                'by_category' => $byCategory,
                'requests' => $requests,
            ],
        ]);
    }

    /**
     * Payroll report.
     */
    public function payrollReport(Request $request)
    {
        $validated = $request->validate([
            'salary_period' => 'required|date_format:Y-m',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'division_id' => 'nullable|exists:divisions,id',
        ]);

        $query = SalarySlip::with(['staffMember.officeLocation', 'staffMember.division'])
            ->forPeriod($validated['salary_period']);

        if (! empty($validated['office_location_id'])) {
            $query->whereHas('staffMember', function ($q) use ($validated) {
                $q->where('office_location_id', $validated['office_location_id']);
            });
        }
        if (! empty($validated['division_id'])) {
            $query->whereHas('staffMember', function ($q) use ($validated) {
                $q->where('division_id', $validated['division_id']);
            });
        }

        $slips = $query->get();

        $summary = [
            'total_employees' => $slips->count(),
            'total_basic_salary' => $slips->sum('basic_salary'),
            'total_earnings' => $slips->sum('total_earnings'),
            'total_deductions' => $slips->sum('total_deductions'),
            'total_net_payable' => $slips->sum('net_payable'),
            'paid_count' => $slips->where('status', 'paid')->count(),
            'pending_count' => $slips->where('status', '!=', 'paid')->count(),
        ];

        // Group by division
        $byDivision = $slips->groupBy(function ($slip) {
            return $slip->staffMember?->division_id;
        })->map(function ($items, $divisionId) {
            $division = $items->first()->staffMember?->division;

            return [
                'division_id' => $divisionId,
                'division_title' => $division?->title ?? 'Unassigned',
                'employee_count' => $items->count(),
                'total_net_payable' => $items->sum('net_payable'),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'salary_period' => $validated['salary_period'],
                'summary' => $summary,
                'by_division' => $byDivision,
                'slips' => $slips,
            ],
        ]);
    }

    /**
     * Dashboard statistics.
     */
    public function dashboard(Request $request)
    {
        $today = now();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();

        // Employee counts
        $totalEmployees = StaffMember::count();
        $activeEmployees = StaffMember::active()->count();
        $newThisMonth = StaffMember::whereMonth('hire_date', $today->month)
            ->whereYear('hire_date', $today->year)->count();

        // Attendance today
        $todayAttendance = WorkLog::forDate($today->toDateString())->get();
        $presentToday = $todayAttendance->where('status', 'present')->count();
        $absentToday = $todayAttendance->where('status', 'absent')->count();

        // Leave requests
        $pendingLeaves = TimeOffRequest::pending()->count();
        $approvedLeavesThisMonth = TimeOffRequest::approved()
            ->forPeriod($monthStart, $monthEnd)->count();

        // Upcoming events
        $upcomingEvents = CompanyEvent::upcoming()->limit(5)->get();

        // Recent announcements (filter by publish_date and expire_date)
        $recentAnnouncements = CompanyNotice::where('publish_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('expire_date')
                    ->orWhere('expire_date', '>=', $today);
            })
            ->latest()
            ->limit(5)
            ->get();

        // Payroll status for current month
        $currentPeriod = $today->format('Y-m');
        $payrollStatus = [
            'period' => $currentPeriod,
            'generated' => SalarySlip::forPeriod($currentPeriod)->count(),
            'paid' => SalarySlip::forPeriod($currentPeriod)->paid()->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => [
                    'total' => $totalEmployees,
                    'active' => $activeEmployees,
                    'new_this_month' => $newThisMonth,
                ],
                'attendance_today' => [
                    'present' => $presentToday,
                    'absent' => $absentToday,
                    'not_marked' => $activeEmployees - $todayAttendance->count(),
                ],
                'leave_requests' => [
                    'pending' => $pendingLeaves,
                    'approved_this_month' => $approvedLeavesThisMonth,
                ],
                'payroll' => $payrollStatus,
                'upcoming_events' => $upcomingEvents,
                'recent_announcements' => $recentAnnouncements,
            ],
        ]);
    }

    /**
     * Headcount report by location/division.
     */
    public function headcountReport(Request $request)
    {
        $byLocation = StaffMember::active()
            ->select('office_location_id', DB::raw('COUNT(*) as count'))
            ->with('officeLocation')
            ->groupBy('office_location_id')
            ->get()
            ->map(function ($item) {
                return [
                    'location_id' => $item->office_location_id,
                    'location_name' => $item->officeLocation?->title ?? 'Unassigned',
                    'count' => $item->count,
                ];
            });

        $byDivision = StaffMember::active()
            ->select('division_id', DB::raw('COUNT(*) as count'))
            ->with('division')
            ->groupBy('division_id')
            ->get()
            ->map(function ($item) {
                return [
                    'division_id' => $item->division_id,
                    'division_name' => $item->division?->title ?? 'Unassigned',
                    'count' => $item->count,
                ];
            });

        $byJobTitle = StaffMember::active()
            ->select('job_title_id', DB::raw('COUNT(*) as count'))
            ->with('jobTitle')
            ->groupBy('job_title_id')
            ->get()
            ->map(function ($item) {
                return [
                    'job_title_id' => $item->job_title_id,
                    'job_title_name' => $item->jobTitle?->title ?? 'Unassigned',
                    'count' => $item->count,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'total_active' => StaffMember::active()->count(),
                'by_location' => $byLocation,
                'by_division' => $byDivision,
                'by_job_title' => $byJobTitle,
            ],
        ]);
    }
}
