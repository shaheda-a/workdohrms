<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Offboarding;
use App\Models\StaffMember;
use Illuminate\Http\Request;

class OffboardingController extends Controller
{
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

        return response()->json(['success' => true, 'data' => $offboardings]);
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

        return response()->json([
            'success' => true,
            'message' => 'Offboarding recorded and staff member status updated',
            'data' => $offboarding->load(['staffMember', 'exitCategory']),
        ], 201);
    }

    public function show(Offboarding $offboarding)
    {
        return response()->json([
            'success' => true,
            'data' => $offboarding->load(['staffMember', 'exitCategory', 'author']),
        ]);
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

        return response()->json([
            'success' => true,
            'message' => 'Offboarding updated',
            'data' => $offboarding->fresh(['staffMember', 'exitCategory']),
        ]);
    }

    public function destroy(Offboarding $offboarding)
    {
        $offboarding->delete();

        return response()->json([
            'success' => true,
            'message' => 'Offboarding record deleted',
        ]);
    }
}
