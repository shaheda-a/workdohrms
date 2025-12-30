<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\LocationTransfer;
use App\Models\StaffMember;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class LocationTransferController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = LocationTransfer::with(['staffMember', 'newOfficeLocation', 'newDivision', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }

        $transfers = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($transfers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'new_office_location_id' => 'required|exists:office_locations,id',
            'new_division_id' => 'nullable|exists:divisions,id',
            'effective_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $transfer = LocationTransfer::create($validated);

        // Update staff member's location and division
        StaffMember::find($validated['staff_member_id'])->update([
            'office_location_id' => $validated['new_office_location_id'],
            'division_id' => $validated['new_division_id'] ?? null,
        ]);

        return $this->created($transfer->load(['staffMember', 'newOfficeLocation', 'newDivision']), 'Location transfer recorded and staff member updated');
    }

    public function update(Request $request, LocationTransfer $locationTransfer)
    {
        $validated = $request->validate([
            'effective_date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
        ]);

        $locationTransfer->update($validated);

        return $this->success($locationTransfer->fresh(['staffMember', 'newOfficeLocation', 'newDivision']), 'Location transfer updated');
    }

    public function destroy(LocationTransfer $locationTransfer)
    {
        $locationTransfer->delete();

        return $this->noContent('Location transfer record deleted');
    }
}
