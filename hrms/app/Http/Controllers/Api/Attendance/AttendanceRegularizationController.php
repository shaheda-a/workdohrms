<?php

namespace App\Http\Controllers\Api\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRegularization;
use App\Models\WorkLog;
use App\Traits\ApiResponse;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceRegularizationController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = AttendanceRegularization::with(['staffMember', 'workLog', 'reviewer']);

        if ($request->staff_member_id) {
            $query->where('staff_member_id', $request->staff_member_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date_from) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $regularizations = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return $this->success($regularizations);
    }

    public function store(Request $request)
    {
        // Inline validation for Scramble to detect request body parameters
        $validated = $request->validate([
            'staff_member_id' => 'nullable|exists:staff_members,id',
            'work_log_id' => 'nullable|exists:work_logs,id',
            'date' => 'required|date|before_or_equal:today',
            'requested_clock_in' => 'required|date',
            'requested_clock_out' => 'nullable|date|after:requested_clock_in',
            'reason' => 'required|string|max:1000',
        ]);

        // Use provided staff_member_id or fall back to logged-in user's staff member
        $staffMemberId = $request->staff_member_id ?? auth()->user()->staffMember?->id;

        if (! $staffMemberId) {
            return $this->error('Staff member not found. Please provide staff_member_id or login as a staff member.', 400);
        }

        // Get original clock times if work_log_id provided
        $originalClockIn = null;
        $originalClockOut = null;
        if ($request->work_log_id) {
            $workLog = WorkLog::find($request->work_log_id);
            $originalClockIn = $workLog?->clock_in;
            $originalClockOut = $workLog?->clock_out;
        }

        $regularization = AttendanceRegularization::create([
            'staff_member_id' => $staffMemberId,
            'work_log_id' => $request->work_log_id,
            'date' => $request->date,
            'original_clock_in' => $originalClockIn,
            'original_clock_out' => $originalClockOut,
            'requested_clock_in' => $request->requested_clock_in,
            'requested_clock_out' => $request->requested_clock_out,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        return $this->created($regularization->load('staffMember'), 'Regularization request submitted successfully');
    }

    public function show(AttendanceRegularization $attendanceRegularization)
    {
        $attendanceRegularization->load(['staffMember', 'workLog', 'reviewer']);

        return $this->success($attendanceRegularization);
    }

    public function approve(Request $request, AttendanceRegularization $attendanceRegularization)
    {
        if ($attendanceRegularization->status !== 'pending') {
            return $this->error('Only pending requests can be approved', 400);
        }

        $attendanceRegularization->update([
            'status' => 'approved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_notes' => $request->notes,
        ]);

        // Update the actual work log if exists
        if ($attendanceRegularization->work_log_id) {
            WorkLog::where('id', $attendanceRegularization->work_log_id)->update([
                'clock_in' => $attendanceRegularization->requested_clock_in,
                'clock_out' => $attendanceRegularization->requested_clock_out,
            ]);
        } else {
            // Create a new work log entry
            WorkLog::create([
                'staff_member_id' => $attendanceRegularization->staff_member_id,
                'log_date' => \Carbon\Carbon::parse(
                    $attendanceRegularization->requested_clock_in
                )->toDateString(),
                'clock_in' => $attendanceRegularization->requested_clock_in,
                'clock_out' => $attendanceRegularization->requested_clock_out,
                'notes' => 'Created via regularization request',
            ]);

        }

        return $this->success($attendanceRegularization, 'Regularization request approved');
    }

    public function reject(Request $request, AttendanceRegularization $attendanceRegularization)
    {
        if ($attendanceRegularization->status !== 'pending') {
            return $this->error('Only pending requests can be rejected', 400);
        }

        $validator = Validator::make($request->all(), [
            'notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $attendanceRegularization->update([
            'status' => 'rejected',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_notes' => $request->notes,
        ]);

        return $this->success($attendanceRegularization, 'Regularization request rejected');
    }

    public function pending()
    {
        $pending = AttendanceRegularization::pending()
            ->with(['staffMember', 'workLog'])
            ->orderBy('created_at', 'asc')
            ->get();

        return $this->success($pending);
    }

    /**
     * Get regularization requests for a specific staff member.
     */
    #[QueryParameter('staff_member_id', description: 'The ID of the staff member to fetch regularization requests for', required: true, type: 'integer', example: 1)]
    public function myRequests(Request $request)
    {
        // Validate that staff_member_id is required
        $validated = $request->validate([
            'staff_member_id' => 'required|integer|exists:staff_members,id',
        ]);

        $requests = AttendanceRegularization::where('staff_member_id', $validated['staff_member_id'])
            ->with(['staffMember', 'workLog', 'reviewer'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success($requests);
    }
}
