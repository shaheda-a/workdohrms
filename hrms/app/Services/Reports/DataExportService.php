<?php

namespace App\Services\Reports;

use App\Models\SalarySlip;
use App\Models\StaffMember;
use App\Models\TimeOffRequest;
use App\Models\WorkLog;
use Illuminate\Support\Collection;

/**
 * Data Export Service
 *
 * Handles all business logic for data export functionality.
 */
class DataExportService
{
    /**
     * Export staff members data.
     */
    public function exportStaffMembers(array $params = []): Collection
    {
        $query = StaffMember::with(['officeLocation', 'division', 'jobTitle', 'user']);

        if (! empty($params['office_location_id'])) {
            $query->where('office_location_id', $params['office_location_id']);
        }

        if (! empty($params['division_id'])) {
            $query->where('division_id', $params['division_id']);
        }

        if (! empty($params['employment_status'])) {
            $query->where('employment_status', $params['employment_status']);
        }

        return $query->get()->map(function ($employee) {
            return [
                'id' => $employee->id,
                'employee_id' => $employee->employee_id,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'office_location' => $employee->officeLocation->name ?? '',
                'division' => $employee->division->name ?? '',
                'job_title' => $employee->jobTitle->name ?? '',
                'employment_status' => $employee->employment_status,
                'hire_date' => $employee->hire_date,
                'base_salary' => $employee->base_salary,
            ];
        });
    }

    /**
     * Export attendance data.
     */
    public function exportAttendance(array $params): Collection
    {
        $query = WorkLog::with(['staffMember']);

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('log_date', [$params['start_date'], $params['end_date']]);
        }

        if (! empty($params['staff_member_id'])) {
            $query->where('staff_member_id', $params['staff_member_id']);
        }

        return $query->get()->map(function ($log) {
            return [
                'id' => $log->id,
                'employee_name' => $log->staffMember->full_name ?? '',
                'employee_id' => $log->staffMember->employee_id ?? '',
                'log_date' => $log->log_date,
                'clock_in' => $log->clock_in,
                'clock_out' => $log->clock_out,
                'total_hours' => $log->total_hours,
                'status' => $log->status,
            ];
        });
    }

    /**
     * Export leave requests data.
     */
    public function exportLeaveRequests(array $params): Collection
    {
        $query = TimeOffRequest::with(['staffMember', 'timeOffCategory']);

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('start_date', [$params['start_date'], $params['end_date']]);
        }

        if (! empty($params['staff_member_id'])) {
            $query->where('staff_member_id', $params['staff_member_id']);
        }

        if (! empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        return $query->get()->map(function ($request) {
            return [
                'id' => $request->id,
                'employee_name' => $request->staffMember->full_name ?? '',
                'employee_id' => $request->staffMember->employee_id ?? '',
                'category' => $request->timeOffCategory->name ?? '',
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'days_requested' => $request->days_requested,
                'status' => $request->status,
                'reason' => $request->reason,
            ];
        });
    }

    /**
     * Export payroll data.
     */
    public function exportPayroll(array $params): Collection
    {
        $query = SalarySlip::with(['staffMember']);

        if (! empty($params['salary_period'])) {
            $query->where('salary_period', $params['salary_period']);
        }

        if (! empty($params['month']) && ! empty($params['year'])) {
            $query->whereMonth('salary_period', $params['month'])
                ->whereYear('salary_period', $params['year']);
        }

        if (! empty($params['staff_member_id'])) {
            $query->where('staff_member_id', $params['staff_member_id']);
        }

        return $query->get()->map(function ($slip) {
            return [
                'id' => $slip->id,
                'reference' => $slip->reference,
                'employee_name' => $slip->staffMember->full_name ?? '',
                'employee_id' => $slip->staffMember->employee_id ?? '',
                'salary_period' => $slip->salary_period,
                'base_salary' => $slip->base_salary,
                'total_earnings' => $slip->total_earnings,
                'total_deductions' => $slip->total_deductions,
                'net_payable' => $slip->net_payable,
                'status' => $slip->status,
            ];
        });
    }
}
