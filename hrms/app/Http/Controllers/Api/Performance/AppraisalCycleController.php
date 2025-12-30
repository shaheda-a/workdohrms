<?php

namespace App\Http\Controllers\Api\Performance;

use App\Http\Controllers\Controller;
use App\Models\AppraisalCycle;
use App\Models\AppraisalRecord;
use App\Models\StaffMember;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AppraisalCycleController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = AppraisalCycle::withCount('records')->with('author');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $cycles = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($cycles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'cycle_start' => 'required|date',
            'cycle_end' => 'required|date|after_or_equal:cycle_start',
            'review_deadline' => 'nullable|date|after_or_equal:cycle_start',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = 'draft';
        $validated['author_id'] = $request->user()->id;

        $cycle = AppraisalCycle::create($validated);

        return $this->created($cycle, 'Appraisal cycle created');
    }

    public function show(AppraisalCycle $appraisalCycle)
    {
        return $this->success($appraisalCycle->load(['author', 'records.staffMember']));
    }

    /**
     * Activate cycle and create records for all active staff.
     */
    public function activate(Request $request, AppraisalCycle $appraisalCycle)
    {
        if ($appraisalCycle->status !== 'draft') {
            return $this->error('Cycle is not in draft status', 422);
        }

        // Create appraisal records for all active staff
        $staffMembers = StaffMember::active()->get();
        $created = 0;

        foreach ($staffMembers as $staff) {
            if (! AppraisalRecord::where('appraisal_cycle_id', $appraisalCycle->id)
                ->where('staff_member_id', $staff->id)->exists()) {
                AppraisalRecord::create([
                    'appraisal_cycle_id' => $appraisalCycle->id,
                    'staff_member_id' => $staff->id,
                    'status' => 'pending',
                ]);
                $created++;
            }
        }

        $appraisalCycle->update(['status' => 'active']);

        return $this->success($appraisalCycle->fresh());
    }

    /**
     * Close cycle.
     */
    public function close(Request $request, AppraisalCycle $appraisalCycle)
    {
        $appraisalCycle->update(['status' => 'closed']);

        return $this->success($appraisalCycle->fresh(), 'Cycle closed');
    }

    public function update(Request $request, AppraisalCycle $appraisalCycle)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'cycle_start' => 'sometimes|required|date',
            'cycle_end' => 'sometimes|required|date',
            'review_deadline' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $appraisalCycle->update($validated);

        return $this->success($appraisalCycle->fresh(), 'Cycle updated');
    }

    public function destroy(AppraisalCycle $appraisalCycle)
    {
        if ($appraisalCycle->status !== 'draft') {
            return $this->error('Can only delete draft cycles', 422);
        }

        $appraisalCycle->delete();

        return $this->noContent('Cycle deleted');
    }
}
