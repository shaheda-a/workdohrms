<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Grievance;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class GrievanceController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Grievance::with(['filedByStaff', 'againstStaff', 'againstDivision', 'author']);

        if ($request->filled('filed_by')) {
            $query->where('filed_by_staff_id', $request->filed_by);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $grievances = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($grievances);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'filed_by_staff_id' => 'required|exists:staff_members,id',
            'against_staff_id' => 'nullable|exists:staff_members,id',
            'against_division_id' => 'nullable|exists:divisions,id',
            'subject' => 'required|string|max:255',
            'incident_date' => 'required|date',
            'description' => 'required|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $validated['status'] = 'filed';
        $grievance = Grievance::create($validated);

        return $this->created($grievance->load('filedByStaff'), 'Grievance filed successfully');
    }

    public function show(Grievance $grievance)
    {
        return $this->success($grievance->load(['filedByStaff', 'againstStaff', 'againstDivision', 'author']));
    }

    public function update(Request $request, Grievance $grievance)
    {
        $validated = $request->validate([
            'subject' => 'sometimes|required|string|max:255',
            'incident_date' => 'sometimes|required|date',
            'description' => 'sometimes|required|string',
            'status' => 'sometimes|required|in:filed,investigating,resolved,dismissed',
            'resolution' => 'nullable|string',
            'resolved_date' => 'nullable|date',
        ]);

        $grievance->update($validated);

        return $this->success($grievance->fresh(['filedByStaff', 'againstStaff', 'againstDivision']), 'Grievance updated');
    }

    /**
     * Update grievance status.
     */
    public function updateStatus(Request $request, Grievance $grievance)
    {
        $validated = $request->validate([
            'status' => 'required|in:filed,investigating,resolved,dismissed',
            'resolution' => 'required_if:status,resolved|nullable|string',
        ]);

        $updateData = ['status' => $validated['status']];

        if ($validated['status'] === 'resolved') {
            $updateData['resolution'] = $validated['resolution'] ?? null;
            $updateData['resolved_date'] = now();
        }

        $grievance->update($updateData);

        return $this->success($grievance->fresh(), 'Grievance status updated to '.$validated['status']);
    }

    public function destroy(Grievance $grievance)
    {
        $grievance->delete();

        return $this->noContent('Grievance deleted');
    }
}
