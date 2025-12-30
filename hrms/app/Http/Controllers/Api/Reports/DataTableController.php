<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Models\SalarySlip;
use App\Models\StaffMember;
use App\Models\TimeOffRequest;
use App\Models\WorkLog;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class DataTableController extends Controller
{
    use ApiResponse;

    /**
     * Staff Members DataTable (server-side).
     */
    public function staffMembers(Request $request)
    {
        $query = StaffMember::with(['officeLocation', 'division', 'jobTitle', 'user']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('staff_code', 'like', "%{$search}%")
                    ->orWhere('personal_email', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('office_location_id')) {
            $query->where('office_location_id', $request->office_location_id);
        }
        if ($request->filled('division_id')) {
            $query->where('division_id', $request->division_id);
        }
        if ($request->filled('job_title_id')) {
            $query->where('job_title_id', $request->job_title_id);
        }
        if ($request->filled('employment_status')) {
            $query->where('employment_status', $request->employment_status);
        }

        // Sorting
        $sortColumn = $request->input('sort_column', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSortColumns = ['staff_code', 'first_name', 'last_name', 'hire_date', 'created_at'];
        if (in_array($sortColumn, $allowedSortColumns)) {
            $query->orderBy($sortColumn, $sortDirection);
        }

        // Total count before pagination
        $totalCount = $query->count();

        // Pagination
        $perPage = min($request->input('per_page', 15), 100);
        $data = $query->paginate($perPage);

        return $this->success($data->items());
    }

    /**
     * Attendance DataTable (server-side).
     */
    public function attendance(Request $request)
    {
        $query = WorkLog::with('staffMember');

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('staffMember', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('staff_code', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('date')) {
            $query->forDate($request->date);
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->forPeriod($request->start_date, $request->end_date);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Sorting
        $query->orderBy('log_date', 'desc');

        $totalCount = $query->count();
        $perPage = min($request->input('per_page', 15), 100);
        $data = $query->paginate($perPage);

        return $this->success($data->items());
    }

    /**
     * Leave Requests DataTable (server-side).
     */
    public function leaveRequests(Request $request)
    {
        $query = TimeOffRequest::with(['staffMember', 'category', 'approvedByUser']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('staffMember', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('staff_code', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('time_off_category_id')) {
            $query->where('time_off_category_id', $request->time_off_category_id);
        }
        if ($request->filled('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->forPeriod($request->start_date, $request->end_date);
        }

        // Sorting
        $query->orderBy('created_at', 'desc');

        $totalCount = $query->count();
        $perPage = min($request->input('per_page', 15), 100);
        $data = $query->paginate($perPage);

        return $this->success($data->items());
    }

    /**
     * Payslips DataTable (server-side).
     */
    public function payslips(Request $request)
    {
        $query = SalarySlip::with(['staffMember.division']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('slip_reference', 'like', "%{$search}%")
                    ->orWhereHas('staffMember', function ($sq) use ($search) {
                        $sq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('staff_code', 'like', "%{$search}%");
                    });
            });
        }

        // Filters
        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('salary_period')) {
            $query->forPeriod($request->salary_period);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Sorting
        $query->orderBy('salary_period', 'desc')->orderBy('created_at', 'desc');

        $totalCount = $query->count();
        $perPage = min($request->input('per_page', 15), 100);
        $data = $query->paginate($perPage);

        return $this->success($data->items());
    }
}
