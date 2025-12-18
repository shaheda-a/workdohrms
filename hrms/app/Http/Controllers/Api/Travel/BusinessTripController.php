<?php

namespace App\Http\Controllers\Api\Travel;

use App\Http\Controllers\Controller;
use App\Models\BusinessTrip;
use Illuminate\Http\Request;

class BusinessTripController extends Controller
{
    public function index(Request $request)
    {
        $query = BusinessTrip::with(['staffMember', 'approvedByUser', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('status')) {
            $query->where('approval_status', $request->status);
        }

        $trips = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $trips]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'departure_date' => 'required|date',
            'return_date' => 'required|date|after_or_equal:departure_date',
            'destination' => 'required|string|max:255',
            'purpose' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $validated['approval_status'] = 'pending';
        $trip = BusinessTrip::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Business trip request submitted',
            'data' => $trip->load('staffMember'),
        ], 201);
    }

    public function show(BusinessTrip $businessTrip)
    {
        return response()->json([
            'success' => true,
            'data' => $businessTrip->load(['staffMember', 'approvedByUser', 'author']),
        ]);
    }

    public function update(Request $request, BusinessTrip $businessTrip)
    {
        $validated = $request->validate([
            'departure_date' => 'sometimes|required|date',
            'return_date' => 'sometimes|required|date',
            'destination' => 'sometimes|required|string|max:255',
            'purpose' => 'sometimes|required|string',
            'notes' => 'nullable|string',
        ]);

        $businessTrip->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Business trip updated',
            'data' => $businessTrip->fresh('staffMember'),
        ]);
    }

    /**
     * Approve or decline the business trip.
     */
    public function processApproval(Request $request, BusinessTrip $businessTrip)
    {
        $validated = $request->validate([
            'action' => 'required|in:approved,declined',
            'approval_remarks' => 'nullable|string',
        ]);

        $businessTrip->update([
            'approval_status' => $validated['action'],
            'approved_by' => $request->user()->id,
            'approval_remarks' => $validated['approval_remarks'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Business trip '.$validated['action'],
            'data' => $businessTrip->fresh(['staffMember', 'approvedByUser']),
        ]);
    }

    public function destroy(BusinessTrip $businessTrip)
    {
        $businessTrip->delete();

        return response()->json([
            'success' => true,
            'message' => 'Business trip deleted',
        ]);
    }
}
