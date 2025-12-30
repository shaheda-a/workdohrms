<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\EmployeeOnboarding;
use App\Models\OnboardingTaskCompletion;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeOnboardingController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = EmployeeOnboarding::with(['staffMember', 'template']);

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->staff_member_id) {
            $query->where('staff_member_id', $request->staff_member_id);
        }

        $onboardings = $query->paginate($request->per_page ?? 15);

        return $this->success($onboardings);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_id' => 'required|exists:staff_members,id',
            'onboarding_template_id' => 'required|exists:onboarding_templates,id',
            'start_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $onboarding = EmployeeOnboarding::create([
            'staff_member_id' => $request->staff_member_id,
            'onboarding_template_id' => $request->onboarding_template_id,
            'start_date' => $request->start_date,
            'status' => 'pending',
        ]);

        return $this->created($onboarding->load(['staffMember', 'template.tasks']), 'Onboarding assigned successfully');
        $employeeOnboarding->progress = $employeeOnboarding->progress;

        return $this->success($employeeOnboarding);
    }

    public function completeTask(Request $request, EmployeeOnboarding $employeeOnboarding)
    {
        $validator = Validator::make($request->all(), [
            'onboarding_task_id' => 'required|exists:onboarding_tasks,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $existing = OnboardingTaskCompletion::where('employee_onboarding_id', $employeeOnboarding->id)
            ->where('onboarding_task_id', $request->onboarding_task_id)
            ->first();

        if ($existing) {
            return $this->error('Task already completed', 400);
        }

        $completion = OnboardingTaskCompletion::create([
            'employee_onboarding_id' => $employeeOnboarding->id,
            'onboarding_task_id' => $request->onboarding_task_id,
            'completed_at' => now(),
            'completed_by' => auth()->id(),
            'notes' => $request->notes,
        ]);

        // Update status
        if ($employeeOnboarding->status === 'pending') {
            $employeeOnboarding->update(['status' => 'in_progress']);
        }

        // Check if all tasks completed
        $totalTasks = $employeeOnboarding->template->tasks()->count();
        $completedTasks = $employeeOnboarding->taskCompletions()->count();

        if ($completedTasks >= $totalTasks) {
            $employeeOnboarding->update(['status' => 'completed']);
        }

        return $this->success($completion, 'Task completed');
    }

    public function pending()
    {
        $onboardings = EmployeeOnboarding::with(['staffMember', 'template'])
            ->whereIn('status', ['pending', 'in_progress'])
            ->get();

        return $this->success($onboardings);
    }
}
