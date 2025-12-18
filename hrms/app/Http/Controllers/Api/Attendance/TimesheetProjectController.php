<?php

namespace App\Http\Controllers\Api\Attendance;

use App\Http\Controllers\Controller;
use App\Models\TimesheetProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TimesheetProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = TimesheetProject::withCount('timesheets');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $projects = $request->paginate === 'false' ? $query->get() : $query->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $projects]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_billable' => 'nullable|boolean',
            'hourly_rate' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $project = TimesheetProject::create($request->all());

        return response()->json(['success' => true, 'message' => 'Project created', 'data' => $project], 201);
    }

    public function show(TimesheetProject $timesheetProject)
    {
        return response()->json(['success' => true, 'data' => $timesheetProject]);
    }

    public function update(Request $request, TimesheetProject $timesheetProject)
    {
        $timesheetProject->update($request->all());

        return response()->json(['success' => true, 'message' => 'Updated', 'data' => $timesheetProject]);
    }

    public function destroy(TimesheetProject $timesheetProject)
    {
        $timesheetProject->delete();

        return response()->json(['success' => true, 'message' => 'Deleted']);
    }
}
