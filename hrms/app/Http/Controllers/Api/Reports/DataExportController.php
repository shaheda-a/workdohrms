<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Models\SalarySlip;
use App\Models\StaffMember;
use App\Models\TimeOffRequest;
use App\Models\WorkLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DataExportController extends Controller
{
    use ApiResponse;

    /**
     * Export staff members to CSV.
     */
    public function exportStaffMembers(Request $request)
    {
        $query = StaffMember::with(['officeLocation', 'division', 'jobTitle']);

        if ($request->filled('office_location_id')) {
            $query->where('office_location_id', $request->office_location_id);
        }
        if ($request->filled('division_id')) {
            $query->where('division_id', $request->division_id);
        }
        if ($request->filled('status')) {
            $query->where('employment_status', $request->status);
        }

        $staff = $query->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="staff_members_'.now()->format('Y-m-d').'.csv"',
        ];

        $columns = ['Staff Code', 'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Hire Date', 'Base Salary', 'Status', 'Office Location', 'Division', 'Job Title'];

        $callback = function () use ($staff, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($staff as $s) {
                fputcsv($file, [
                    $s->staff_code,
                    $s->first_name,
                    $s->last_name,
                    $s->personal_email,
                    $s->phone_number,
                    $s->date_of_birth?->format('Y-m-d'),
                    $s->gender,
                    $s->hire_date?->format('Y-m-d'),
                    $s->base_salary,
                    $s->employment_status,
                    $s->officeLocation?->title,
                    $s->division?->title,
                    $s->jobTitle?->title,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export attendance to CSV.
     */
    public function exportAttendance(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $query = WorkLog::with('staffMember')
            ->forPeriod($request->start_date, $request->end_date);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }

        $logs = $query->orderBy('log_date')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="attendance_'.$request->start_date.'_to_'.$request->end_date.'.csv"',
        ];

        $columns = ['Staff Code', 'Staff Name', 'Date', 'Status', 'Clock In', 'Clock Out', 'Late (mins)', 'Overtime (mins)', 'Early Leave (mins)'];

        $callback = function () use ($logs, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->staffMember?->staff_code,
                    $log->staffMember?->full_name,
                    $log->log_date->format('Y-m-d'),
                    $log->status,
                    $log->clock_in,
                    $log->clock_out,
                    $log->late_minutes,
                    $log->overtime_minutes,
                    $log->early_leave_minutes,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export leave requests to CSV.
     */
    public function exportLeaves(Request $request)
    {
        $request->validate([
            'year' => 'required|integer',
        ]);

        $query = TimeOffRequest::with(['staffMember', 'category'])
            ->whereYear('start_date', $request->year);

        if ($request->filled('month')) {
            $query->whereMonth('start_date', $request->month);
        }
        if ($request->filled('status')) {
            $query->where('approval_status', $request->status);
        }

        $leaves = $query->orderBy('start_date')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="leaves_'.$request->year.'.csv"',
        ];

        $columns = ['Staff Code', 'Staff Name', 'Category', 'Start Date', 'End Date', 'Days', 'Status', 'Reason'];

        $callback = function () use ($leaves, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($leaves as $leave) {
                fputcsv($file, [
                    $leave->staffMember?->staff_code,
                    $leave->staffMember?->full_name,
                    $leave->category?->title,
                    $leave->start_date->format('Y-m-d'),
                    $leave->end_date->format('Y-m-d'),
                    $leave->total_days,
                    $leave->approval_status,
                    $leave->reason,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export payroll summary to CSV.
     */
    public function exportPayroll(Request $request)
    {
        $request->validate([
            'salary_period' => 'required|date_format:Y-m',
        ]);

        $slips = SalarySlip::with(['staffMember.officeLocation', 'staffMember.division'])
            ->forPeriod($request->salary_period)
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="payroll_'.$request->salary_period.'.csv"',
        ];

        $columns = ['Slip Reference', 'Staff Code', 'Staff Name', 'Division', 'Basic Salary', 'Total Earnings', 'Total Deductions', 'Net Payable', 'Status'];

        $callback = function () use ($slips, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($slips as $slip) {
                fputcsv($file, [
                    $slip->slip_reference,
                    $slip->staffMember?->staff_code,
                    $slip->staffMember?->full_name,
                    $slip->staffMember?->division?->title,
                    $slip->basic_salary,
                    $slip->total_earnings,
                    $slip->total_deductions,
                    $slip->net_payable,
                    $slip->status,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
