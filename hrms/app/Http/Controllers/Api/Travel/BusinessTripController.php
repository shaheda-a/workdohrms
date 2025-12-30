<?php

namespace App\Http\Controllers\Api\Travel;

use App\Http\Controllers\Controller;
use App\Models\BusinessTrip;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BusinessTripController extends Controller
{
    use ApiResponse;

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

        return $this->success($trips);
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

        return $this->created($trip->load('staffMember'), 'Business trip request submitted');
    }

    public function show(BusinessTrip $businessTrip)
    {
        return $this->success($businessTrip->load(['staffMember', 'approvedByUser', 'author']));
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

        return $this->success($businessTrip->fresh('staffMember'), 'Business trip updated');
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

        return $this->success($businessTrip->fresh(['staffMember', 'approvedByUser']), 'Business trip ');
    }

    public function destroy(BusinessTrip $businessTrip)
    {
        $businessTrip->delete();

        return $this->noContent('Business trip deleted');
    }
}
