<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobStageController extends Controller
{
    public function index(Request $request)
    {
        $stages = JobStage::orderBy('order')->get();

        return response()->json([
            'success' => true,
            'data' => $stages
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
            'is_default' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $maxOrder = JobStage::max('order') ?? 0;
        
        $stage = JobStage::create([
            'title' => $request->title,
            'color' => $request->color ?? '#6366f1',
            'order' => $maxOrder + 1,
            'is_default' => $request->is_default ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Job stage created successfully',
            'data' => $stage
        ], 201);
    }

    public function show(JobStage $jobStage)
    {
        return response()->json([
            'success' => true,
            'data' => $jobStage
        ]);
    }

    public function update(Request $request, JobStage $jobStage)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'color' => 'nullable|string|max:20',
            'is_default' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $jobStage->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Job stage updated successfully',
            'data' => $jobStage
        ]);
    }

    public function destroy(JobStage $jobStage)
    {
        $jobStage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job stage deleted successfully'
        ]);
    }

    public function reorder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stages' => 'required|array',
            'stages.*.id' => 'required|exists:job_stages,id',
            'stages.*.order' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        foreach ($request->stages as $stageData) {
            JobStage::where('id', $stageData['id'])->update(['order' => $stageData['order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Stages reordered successfully',
            'data' => JobStage::orderBy('order')->get()
        ]);
    }
}
