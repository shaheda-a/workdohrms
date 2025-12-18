<?php

namespace App\Services\Reports;

use App\Models\SalarySlip;
use App\Models\StaffMember;
use App\Models\TimeOffRequest;
use App\Models\WorkLog;

/**
 * Report Service
 *
 * Handles all business logic for report generation.
 */
class ReportService
{
    /**
     * Generate attendance report.
     */
    public function attendanceReport(array $params): array
    {
        $startDate = $params['start_date'];
        $endDate = $params['end_date'];
        $staffMemberId = $params['staff_member_id'] ?? null;
        $divisionId = $params['division_id'] ?? null;

        $query = WorkLog::with(['staffMember'])
            ->whereBetween('log_date', [$startDate, $endDate]);

        if ($staffMemberId) {
            $query->where('staff_member_id', $staffMemberId);
        }

        if ($divisionId) {
            $query->whereHas('staffMember', function ($q) use ($divisionId) {
                $q->where('division_id', $divisionId);
            });
        }

        $logs = $query->get();

        $summary = [
            'total_records' => $logs->count(),
            'present_days' => $logs->where('status', 'present')->count(),
            'absent_days' => $logs->where('status', 'absent')->count(),
            'late_days' => $logs->where('status', 'late')->count(),
            'half_days' => $logs->where('status', 'half_day')->count(),
            'leave_days' => $logs->where('status', 'leave')->count(),
            'total_hours' => $logs->sum('total_hours'),
        ];

        return [
            'summary' => $summary,
            'records' => $logs,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ];
    }

    /**
     * Generate leave report.
     */
    public function leaveReport(array $params): array
    {
        $startDate = $params['start_date'];
        $endDate = $params['end_date'];
        $staffMemberId = $params['staff_member_id'] ?? null;
        $categoryId = $params['time_off_category_id'] ?? null;

        $query = TimeOffRequest::with(['staffMember', 'timeOffCategory'])
            ->whereBetween('start_date', [$startDate, $endDate]);

        if ($staffMemberId) {
            $query->where('staff_member_id', $staffMemberId);
        }

        if ($categoryId) {
            $query->where('time_off_category_id', $categoryId);
        }

        $requests = $query->get();

        $summary = [
            'total_requests' => $requests->count(),
            'approved' => $requests->where('status', 'approved')->count(),
            'pending' => $requests->where('status', 'pending')->count(),
            'declined' => $requests->where('status', 'declined')->count(),
            'total_days' => $requests->where('status', 'approved')->sum('days_requested'),
        ];

        $byCategory = $requests->where('status', 'approved')
            ->groupBy('time_off_category_id')
            ->map(function ($group) {
                return [
                    'category' => $group->first()->timeOffCategory->name ?? 'Unknown',
                    'count' => $group->count(),
                    'days' => $group->sum('days_requested'),
                ];
            })->values();

        return [
            'summary' => $summary,
            'by_category' => $byCategory,
            'records' => $requests,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ];
    }

    /**
     * Generate payroll report.
     */
    public function payrollReport(array $params): array
    {
        $salaryPeriod = $params['salary_period'] ?? null;
        $month = $params['month'] ?? null;
        $year = $params['year'] ?? null;
        $divisionId = $params['division_id'] ?? null;

        $query = SalarySlip::with(['staffMember']);

        if ($salaryPeriod) {
            $query->where('salary_period', $salaryPeriod);
        } elseif ($month && $year) {
            $query->whereMonth('salary_period', $month)
                ->whereYear('salary_period', $year);
        }

        if ($divisionId) {
            $query->whereHas('staffMember', function ($q) use ($divisionId) {
                $q->where('division_id', $divisionId);
            });
        }

        $slips = $query->get();

        $summary = [
            'total_slips' => $slips->count(),
            'total_earnings' => $slips->sum('total_earnings'),
            'total_deductions' => $slips->sum('total_deductions'),
            'total_net_payable' => $slips->sum('net_payable'),
            'generated' => $slips->where('status', 'generated')->count(),
            'paid' => $slips->where('status', 'paid')->count(),
        ];

        return [
            'summary' => $summary,
            'records' => $slips,
            'period' => $salaryPeriod ?? "{$year}-{$month}",
        ];
    }

    /**
     * Generate employee report.
     */
    public function employeeReport(array $params): array
    {
        $query = StaffMember::with(['officeLocation', 'division', 'jobTitle']);

        if (! empty($params['office_location_id'])) {
            $query->where('office_location_id', $params['office_location_id']);
        }

        if (! empty($params['division_id'])) {
            $query->where('division_id', $params['division_id']);
        }

        if (! empty($params['employment_status'])) {
            $query->where('employment_status', $params['employment_status']);
        }

        $employees = $query->get();

        $summary = [
            'total_employees' => $employees->count(),
            'active' => $employees->where('employment_status', 'active')->count(),
            'on_probation' => $employees->where('employment_status', 'probation')->count(),
            'terminated' => $employees->where('employment_status', 'terminated')->count(),
        ];

        $byDivision = $employees->groupBy('division_id')
            ->map(function ($group) {
                return [
                    'division' => $group->first()->division->name ?? 'Unknown',
                    'count' => $group->count(),
                ];
            })->values();

        $byLocation = $employees->groupBy('office_location_id')
            ->map(function ($group) {
                return [
                    'location' => $group->first()->officeLocation->name ?? 'Unknown',
                    'count' => $group->count(),
                ];
            })->values();

        return [
            'summary' => $summary,
            'by_division' => $byDivision,
            'by_location' => $byLocation,
            'records' => $employees,
        ];
    }

    /**
     * Generate headcount trend report.
     */
    public function headcountTrend(int $months = 12): array
    {
        $trend = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = StaffMember::where('created_at', '<=', $date->endOfMonth())
                ->where(function ($q) use ($date) {
                    $q->whereNull('termination_date')
                        ->orWhere('termination_date', '>', $date->endOfMonth());
                })
                ->count();

            $trend[] = [
                'month' => $date->format('Y-m'),
                'count' => $count,
            ];
        }

        return $trend;
    }
}
