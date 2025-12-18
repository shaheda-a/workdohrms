<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRegularization;
use App\Models\WorkLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceRegularizationController extends Controller
{
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

        return response()->json([
            'success' => true,
            'data' => $regularizations
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'work_log_id' => 'nullable|exists:work_logs,id',
            'date' => 'required|date|before_or_equal:today',
            'requested_clock_in' => 'required|date',
            'requested_clock_out' => 'nullable|date|after:requested_clock_in',
            'reason' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $staffMemberId = auth()->user()->staffMember?->id;
        if (!$staffMemberId) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found'
            ], 400);
        }

        // Get original clock times if work_log_id provided
        $originalClockIn = null;
        $originalClockOut = null;
        if ($request->work_log_id) {
            $workLog = WorkLog::find($request->work_log_id);
            $originalClockIn = $workLog->clock_in;
            $originalClockOut = $workLog->clock_out;
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

        return response()->json([
            'success' => true,
            'message' => 'Regularization request submitted successfully',
            'data' => $regularization
        ], 201);
    }

    public function show(AttendanceRegularization $attendanceRegularization)
    {
        $attendanceRegularization->load(['staffMember', 'workLog', 'reviewer']);
        return response()->json([
            'success' => true,
            'data' => $attendanceRegularization
        ]);
    }

    public function approve(Request $request, AttendanceRegularization $attendanceRegularization)
    {
        if ($attendanceRegularization->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be approved'
            ], 400);
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
                'clock_in' => $attendanceRegularization->requested_clock_in,
                'clock_out' => $attendanceRegularization->requested_clock_out,
                'notes' => 'Created via regularization request',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Regularization request approved',
            'data' => $attendanceRegularization
        ]);
    }

    public function reject(Request $request, AttendanceRegularization $attendanceRegularization)
    {
        if ($attendanceRegularization->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending requests can be rejected'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $attendanceRegularization->update([
            'status' => 'rejected',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Regularization request rejected',
            'data' => $attendanceRegularization
        ]);
    }

    public function pending()
    {
        $pending = AttendanceRegularization::pending()
            ->with(['staffMember', 'workLog'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pending
        ]);
    }

    public function myRequests()
    {
        $staffMemberId = auth()->user()->staffMember?->id;

        if (!$staffMemberId) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        $requests = AttendanceRegularization::where('staff_member_id', $staffMemberId)
            ->with(['workLog', 'reviewer'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requests
        ]);
    }
}
