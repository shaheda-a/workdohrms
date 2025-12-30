<?php

namespace App\Http\Controllers\Api\Performance;

use App\Http\Controllers\Controller;
use App\Models\PerformanceObjective;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PerformanceObjectiveController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = PerformanceObjective::with(['staffMember', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('type')) {
            $query->ofType($request->type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->boolean('overdue_only', false)) {
            $query->overdue();
        }

        $objectives = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $objectives]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'objective_type' => 'required|in:kpi,goal,okr',
            'measurement_unit' => 'nullable|string|max:50',
            'target_value' => 'nullable|numeric|min:0',
            'weight_percentage' => 'nullable|integer|min:1|max:100',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:start_date',
        ]);

        $validated['status'] = 'not_started';
        $validated['current_value'] = 0;
        $validated['author_id'] = $request->user()->id;

        $objective = PerformanceObjective::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Objective created',
            'data' => $objective->load('staffMember'),
        ], 201);
    }

    public function show(PerformanceObjective $performanceObjective)
    {
        $data = $performanceObjective->load(['staffMember', 'author'])->toArray();
        $data['completion_percentage'] = $performanceObjective->completion_percentage;
        $data['is_overdue'] = $performanceObjective->is_overdue;

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Update progress on an objective.
     */
    public function updateProgress(Request $request, PerformanceObjective $performanceObjective)
    {
        $validated = $request->validate([
            'current_value' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $performanceObjective->current_value = $validated['current_value'];

        // Auto-update status
        if ($performanceObjective->status === 'not_started') {
            $performanceObjective->status = 'in_progress';
        }
        if ($performanceObjective->target_value &&
            $performanceObjective->current_value >= $performanceObjective->target_value) {
            $performanceObjective->status = 'completed';
        }

        $performanceObjective->save();

        return response()->json([
            'success' => true,
            'message' => 'Progress updated',
            'data' => array_merge($performanceObjective->fresh()->toArray(), [
                'completion_percentage' => $performanceObjective->fresh()->completion_percentage,
            ]),
        ]);
    }

    /**
     * Rate an objective (manager action).
     */
    public function rate(Request $request, PerformanceObjective $performanceObjective)
    {
        $validated = $request->validate([
            'rating' => 'required|in:exceeds,meets,below,needs_improvement',
            'manager_notes' => 'nullable|string',
        ]);

        $performanceObjective->update([
            'rating' => $validated['rating'],
            'manager_notes' => $validated['manager_notes'],
            'status' => 'completed',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Objective rated',
            'data' => $performanceObjective->fresh(),
        ]);
    }

    public function update(Request $request, PerformanceObjective $performanceObjective)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'objective_type' => 'sometimes|required|in:kpi,goal,okr',
            'measurement_unit' => 'nullable|string|max:50',
            'target_value' => 'nullable|numeric|min:0',
            'weight_percentage' => 'nullable|integer|min:1|max:100',
            'start_date' => 'sometimes|required|date',
            'due_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:not_started,in_progress,completed,cancelled',
        ]);

        $performanceObjective->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Objective updated',
            'data' => $performanceObjective->fresh(),
        ]);
    }

    public function destroy(PerformanceObjective $performanceObjective)
    {
        $performanceObjective->delete();

        return response()->json([
            'success' => true,
            'message' => 'Objective deleted',
        ]);
    }
}
