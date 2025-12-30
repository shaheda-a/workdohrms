<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\StaffMember;
use App\Models\VoluntaryExit;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class VoluntaryExitController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = VoluntaryExit::with(['staffMember', 'approvedByUser', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('status')) {
            $query->where('approval_status', $request->status);
        }

        $exits = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($exits);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'notice_date' => 'required|date',
            'exit_date' => 'required|date|after_or_equal:notice_date',
            'reason' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $validated['approval_status'] = 'pending';
        $exit = VoluntaryExit::create($validated);

        return $this->created($exit->load('staffMember'), 'Voluntary exit request submitted');
    }

    public function show(VoluntaryExit $voluntaryExit)
    {
        return $this->success($voluntaryExit->load(['staffMember', 'approvedByUser', 'author']));
    }

    public function update(Request $request, VoluntaryExit $voluntaryExit)
    {
        $validated = $request->validate([
            'notice_date' => 'sometimes|required|date',
            'exit_date' => 'sometimes|required|date',
            'reason' => 'nullable|string',
        ]);

        $voluntaryExit->update($validated);

        return $this->success($voluntaryExit->fresh('staffMember'), 'Voluntary exit updated');
    }

    /**
     * Approve or decline the voluntary exit.
     */
    public function processApproval(Request $request, VoluntaryExit $voluntaryExit)
    {
        $validated = $request->validate([
            'action' => 'required|in:approved,declined',
            'approval_remarks' => 'nullable|string',
        ]);

        $voluntaryExit->update([
            'approval_status' => $validated['action'],
            'approved_by' => $request->user()->id,
            'approval_remarks' => $validated['approval_remarks'] ?? null,
        ]);

        // Update staff member status if approved
        if ($validated['action'] === 'approved') {
            StaffMember::find($voluntaryExit->staff_member_id)
                ->update(['employment_status' => 'resigned']);
        }

        return $this->success($voluntaryExit->fresh(['staffMember', 'approvedByUser']), 'Voluntary exit ');
    }

    public function destroy(VoluntaryExit $voluntaryExit)
    {
        $voluntaryExit->delete();

        return $this->noContent('Voluntary exit record deleted');
    }
}
