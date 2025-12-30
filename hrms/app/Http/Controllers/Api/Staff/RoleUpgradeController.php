<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\RoleUpgrade;
use App\Models\StaffMember;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RoleUpgradeController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = RoleUpgrade::with(['staffMember', 'newJobTitle', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }

        $upgrades = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($upgrades);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'new_job_title_id' => 'required|exists:job_titles,id',
            'upgrade_title' => 'required|string|max:255',
            'effective_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $upgrade = RoleUpgrade::create($validated);

        // Update staff member's job title
        StaffMember::find($validated['staff_member_id'])
            ->update(['job_title_id' => $validated['new_job_title_id']]);

        return $this->created($upgrade->load(['staffMember', 'newJobTitle']), 'Role upgrade recorded and staff member updated');
    }

    public function update(Request $request, RoleUpgrade $roleUpgrade)
    {
        $validated = $request->validate([
            'upgrade_title' => 'sometimes|required|string|max:255',
            'effective_date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
        ]);

        $roleUpgrade->update($validated);

        return $this->success($roleUpgrade->fresh(['staffMember', 'newJobTitle']), 'Role upgrade updated');
    }

    public function destroy(RoleUpgrade $roleUpgrade)
    {
        $roleUpgrade->delete();

        return $this->noContent('Role upgrade record deleted');
    }
}
