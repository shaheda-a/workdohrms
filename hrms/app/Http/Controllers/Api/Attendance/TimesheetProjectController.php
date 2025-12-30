<?php

namespace App\Http\Controllers\Api\Attendance;

use App\Http\Controllers\Controller;
use App\Models\TimesheetProject;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TimesheetProjectController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = TimesheetProject::withCount('timesheets');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $projects = $request->paginate === 'false' ? $query->get() : $query->paginate($request->per_page ?? 15);

        return $this->success($projects);
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
            return $this->validationError($validator->errors());
        }

        $project = TimesheetProject::create($request->all());

        return $this->created($project, 'Project created');
    }

    public function show(TimesheetProject $timesheetProject)
    {
        return $this->success($timesheetProject);
    }

    public function update(Request $request, TimesheetProject $timesheetProject)
    {
        $timesheetProject->update($request->all());

        return $this->success($timesheetProject, 'Updated');
    }

    public function destroy(TimesheetProject $timesheetProject)
    {
        $timesheetProject->delete();

        return $this->noContent('Deleted');
    }
}
