<?php

namespace App\Http\Controllers\Api\Performance;

use App\Http\Controllers\Controller;
use App\Models\AppraisalRecord;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AppraisalRecordController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = AppraisalRecord::with(['cycle', 'staffMember', 'reviewer']);

        if ($request->filled('appraisal_cycle_id')) {
            $query->forCycle($request->appraisal_cycle_id);
        }
        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $records = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($records);
    }

    public function show(AppraisalRecord $appraisalRecord)
    {
        return $this->success($appraisalRecord->load(['cycle', 'staffMember', 'reviewer']));
    }

    /**
     * Submit self-assessment (employee action).
     */
    public function submitSelfReview(Request $request, AppraisalRecord $appraisalRecord)
    {
        $validated = $request->validate([
            'self_assessment' => 'required|string',
            'career_goals' => 'nullable|string',
        ]);

        $appraisalRecord->update([
            'self_assessment' => $validated['self_assessment'],
            'career_goals' => $validated['career_goals'] ?? null,
            'status' => 'self_review',
            'self_submitted_at' => now(),
        ]);

        return $this->success($appraisalRecord->fresh(), 'Self-assessment submitted');
    }

    /**
     * Submit manager review.
     */
    public function submitManagerReview(Request $request, AppraisalRecord $appraisalRecord)
    {
        $validated = $request->validate([
            'manager_feedback' => 'required|string',
            'overall_rating' => 'required|numeric|min:1|max:5',
            'strengths' => 'nullable|string',
            'improvements' => 'nullable|string',
        ]);

        $appraisalRecord->update([
            'manager_feedback' => $validated['manager_feedback'],
            'overall_rating' => $validated['overall_rating'],
            'strengths' => $validated['strengths'] ?? null,
            'improvements' => $validated['improvements'] ?? null,
            'status' => 'completed',
            'reviewer_id' => $request->user()->id,
            'manager_submitted_at' => now(),
        ]);

        return $this->success($appraisalRecord->fresh(), 'Manager review submitted');
    }

    /**
     * Get my appraisals (for logged-in employee).
     */
    public function myAppraisals(Request $request)
    {
        $staffMember = \App\Models\StaffMember::where('user_id', $request->user()->id)->first();

        if (! $staffMember) {
            return $this->success([]);
        }

        $records = AppraisalRecord::with('cycle')
            ->where('staff_member_id', $staffMember->id)
            ->latest()
            ->get();

        return $this->success($records);
    }
}
