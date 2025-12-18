<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\StaffMember;
use App\Models\VoluntaryExit;
use Illuminate\Http\Request;

class VoluntaryExitController extends Controller
{
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

        return response()->json(['success' => true, 'data' => $exits]);
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

        return response()->json([
            'success' => true,
            'message' => 'Voluntary exit request submitted',
            'data' => $exit->load('staffMember'),
        ], 201);
    }

    public function show(VoluntaryExit $voluntaryExit)
    {
        return response()->json([
            'success' => true,
            'data' => $voluntaryExit->load(['staffMember', 'approvedByUser', 'author']),
        ]);
    }

    public function update(Request $request, VoluntaryExit $voluntaryExit)
    {
        $validated = $request->validate([
            'notice_date' => 'sometimes|required|date',
            'exit_date' => 'sometimes|required|date',
            'reason' => 'nullable|string',
        ]);

        $voluntaryExit->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Voluntary exit updated',
            'data' => $voluntaryExit->fresh('staffMember'),
        ]);
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

        return response()->json([
            'success' => true,
            'message' => 'Voluntary exit '.$validated['action'],
            'data' => $voluntaryExit->fresh(['staffMember', 'approvedByUser']),
        ]);
    }

    public function destroy(VoluntaryExit $voluntaryExit)
    {
        $voluntaryExit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Voluntary exit record deleted',
        ]);
    }
}
