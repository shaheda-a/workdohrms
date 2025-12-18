<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TimesheetController extends Controller
{
    public function index(Request $request)
    {
        $query = Timesheet::with(['staffMember', 'project']);

        if ($request->staff_member_id) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->timesheet_project_id) {
            $query->where('timesheet_project_id', $request->timesheet_project_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->date_from) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('date', '<=', $request->date_to);
        }

        $timesheets = $query->orderBy('date', 'desc')->paginate($request->per_page ?? 15);
        return response()->json(['success' => true, 'data' => $timesheets]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_id' => 'required|exists:staff_members,id',
            'timesheet_project_id' => 'nullable|exists:timesheet_projects,id',
            'date' => 'required|date',
            'hours' => 'required|numeric|min:0.25|max:24',
            'task_description' => 'nullable|string',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'is_billable' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $timesheet = Timesheet::create($request->all());
        return response()->json(['success' => true, 'message' => 'Timesheet created', 'data' => $timesheet->load('project')], 201);
    }

    public function show(Timesheet $timesheet)
    {
        $timesheet->load(['staffMember', 'project', 'approvedByUser']);
        return response()->json(['success' => true, 'data' => $timesheet]);
    }

    public function update(Request $request, Timesheet $timesheet)
    {
        if ($timesheet->status === 'approved') {
            return response()->json(['success' => false, 'message' => 'Cannot edit approved timesheet'], 400);
        }
        $timesheet->update($request->all());
        return response()->json(['success' => true, 'message' => 'Updated', 'data' => $timesheet]);
    }

    public function destroy(Timesheet $timesheet)
    {
        if ($timesheet->status === 'approved') {
            return response()->json(['success' => false, 'message' => 'Cannot delete approved timesheet'], 400);
        }
        $timesheet->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }

    public function bulkStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'entries' => 'required|array|min:1',
            'entries.*.staff_member_id' => 'required|exists:staff_members,id',
            'entries.*.date' => 'required|date',
            'entries.*.hours' => 'required|numeric|min:0.25',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $timesheets = [];
        foreach ($request->entries as $entry) {
            $timesheets[] = Timesheet::create($entry);
        }

        return response()->json(['success' => true, 'message' => 'Timesheets created', 'data' => $timesheets], 201);
    }

    public function submit(Timesheet $timesheet)
    {
        if ($timesheet->status !== 'draft') {
            return response()->json(['success' => false, 'message' => 'Can only submit draft timesheets'], 400);
        }
        $timesheet->update(['status' => 'submitted']);
        return response()->json(['success' => true, 'message' => 'Timesheet submitted', 'data' => $timesheet]);
    }

    public function approve(Timesheet $timesheet)
    {
        if ($timesheet->status !== 'submitted') {
            return response()->json(['success' => false, 'message' => 'Can only approve submitted timesheets'], 400);
        }
        $timesheet->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);
        return response()->json(['success' => true, 'message' => 'Timesheet approved', 'data' => $timesheet]);
    }

    public function reject(Request $request, Timesheet $timesheet)
    {
        $timesheet->update(['status' => 'rejected']);
        return response()->json(['success' => true, 'message' => 'Timesheet rejected', 'data' => $timesheet]);
    }

    public function summary(Request $request)
    {
        $query = Timesheet::query();

        if ($request->staff_member_id) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->date_from) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('date', '<=', $request->date_to);
        }

        $summary = $query->select([
            DB::raw('SUM(hours) as total_hours'),
            DB::raw('SUM(CASE WHEN is_billable = 1 THEN hours ELSE 0 END) as billable_hours'),
            DB::raw('COUNT(*) as total_entries'),
        ])->first();

        return response()->json(['success' => true, 'data' => $summary]);
    }

    public function employeeTimesheets($staffMemberId)
    {
        $timesheets = Timesheet::where('staff_member_id', $staffMemberId)
            ->with('project')
            ->orderBy('date', 'desc')
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $timesheets]);
    }

    public function report(Request $request)
    {
        $query = Timesheet::with(['staffMember', 'project'])
            ->where('status', 'approved');

        if ($request->date_from) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('date', '<=', $request->date_to);
        }

        $data = $query->get()->groupBy('timesheet_project_id')->map(function ($items, $projectId) {
            return [
                'project' => $items->first()->project,
                'total_hours' => $items->sum('hours'),
                'billable_hours' => $items->where('is_billable', true)->sum('hours'),
                'entries' => $items->count(),
            ];
        })->values();

        return response()->json(['success' => true, 'data' => $data]);
    }
}
