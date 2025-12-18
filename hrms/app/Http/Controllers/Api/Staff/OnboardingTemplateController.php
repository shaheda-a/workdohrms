<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\OnboardingTask;
use App\Models\OnboardingTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OnboardingTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = OnboardingTemplate::withCount('tasks');

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $templates = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $templates]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'days_to_complete' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $template = OnboardingTemplate::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Onboarding template created successfully',
            'data' => $template,
        ], 201);
    }

    public function show(OnboardingTemplate $onboardingTemplate)
    {
        $onboardingTemplate->load('tasks');

        return response()->json(['success' => true, 'data' => $onboardingTemplate]);
    }

    public function update(Request $request, OnboardingTemplate $onboardingTemplate)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $onboardingTemplate->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Template updated successfully',
            'data' => $onboardingTemplate,
        ]);
    }

    public function destroy(OnboardingTemplate $onboardingTemplate)
    {
        $onboardingTemplate->delete();

        return response()->json(['success' => true, 'message' => 'Template deleted']);
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
            return response()->json(['errors' => $validator->errors()], 422);
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

        return response()->json([
            'success' => true,
            'message' => 'Task added successfully',
            'data' => $task,
        ], 201);
    }
}
