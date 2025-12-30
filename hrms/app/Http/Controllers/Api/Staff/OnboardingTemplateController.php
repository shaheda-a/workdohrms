<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\OnboardingTask;
use App\Models\OnboardingTemplate;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OnboardingTemplateController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = OnboardingTemplate::withCount('tasks');

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $templates = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return $this->success($templates);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'days_to_complete' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $template = OnboardingTemplate::create($request->all());

        return $this->created($template, 'Onboarding template created successfully');
    }

    public function show(OnboardingTemplate $onboardingTemplate)
    {
        $onboardingTemplate->load('tasks');

        return $this->success($onboardingTemplate);
    }

    public function update(Request $request, OnboardingTemplate $onboardingTemplate)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $onboardingTemplate->update($request->all());

        return $this->success($onboardingTemplate, 'Template updated successfully');
    }

    public function destroy(OnboardingTemplate $onboardingTemplate)
    {
        $onboardingTemplate->delete();

        return $this->noContent('Template deleted');
    }

    public function addTask(Request $request, OnboardingTemplate $onboardingTemplate)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_required' => 'nullable|boolean',
            'days_before_start' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $maxOrder = $onboardingTemplate->tasks()->max('order') ?? 0;

        $task = OnboardingTask::create([
            'onboarding_template_id' => $onboardingTemplate->id,
            'title' => $request->title,
            'description' => $request->description,
            'is_required' => $request->is_required ?? true,
            'days_before_start' => $request->days_before_start ?? 0,
            'order' => $maxOrder + 1,
        ]);

        return $this->created($task, 'Task added successfully');
    }
}
