<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Offboarding;
use App\Models\StaffMember;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class OffboardingController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Offboarding::with(['staffMember', 'exitCategory', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('exit_category_id')) {
            $query->where('exit_category_id', $request->exit_category_id);
        }

        $offboardings = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($offboardings);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'exit_category_id' => 'required|exists:exit_categories,id',
            'exit_date' => 'required|date',
            'notice_date' => 'nullable|date',
            'details' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $offboarding = Offboarding::create($validated);

        // Update staff member status
        StaffMember::find($validated['staff_member_id'])
            ->update(['employment_status' => 'terminated']);

        return $this->created($offboarding->load(['staffMember', 'exitCategory']), 'Offboarding recorded and staff member status updated');
    }

    public function update(Request $request, Offboarding $offboarding)
    {
        $validated = $request->validate([
            'exit_category_id' => 'sometimes|required|exists:exit_categories,id',
            'exit_date' => 'sometimes|required|date',
            'notice_date' => 'nullable|date',
            'details' => 'nullable|string',
        ]);

        $offboarding->update($validated);

        return $this->success($offboarding->fresh(['staffMember', 'exitCategory']), 'Offboarding updated');
    }

    public function destroy(Offboarding $offboarding)
    {
        $offboarding->delete();

        return $this->noContent('Offboarding record deleted');
    }
}
