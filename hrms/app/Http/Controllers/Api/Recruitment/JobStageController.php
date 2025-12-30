<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\JobStage;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobStageController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $stages = JobStage::orderBy('order')->get();

        return $this->success($stages);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'color' => 'nullable|string|max:20',
            'is_default' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $maxOrder = JobStage::max('order') ?? 0;

        $stage = JobStage::create([
            'title' => $request->title,
            'color' => $request->color ?? '#6366f1',
            'order' => $maxOrder + 1,
            'is_default' => $request->is_default ?? false,
        ]);

        return $this->created($stage, 'Job stage created successfully');
    }

    public function show(JobStage $jobStage)
    {
        return $this->success($jobStage);
    }

    public function update(Request $request, JobStage $jobStage)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'color' => 'nullable|string|max:20',
            'is_default' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $jobStage->update($request->all());

        return $this->success($jobStage, 'Job stage updated successfully');
    }

    public function destroy(JobStage $jobStage)
    {
        $jobStage->delete();

        return $this->noContent('Job stage deleted successfully');
    }

    public function reorder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'stages' => 'required|array',
            'stages.*.id' => 'required|exists:job_stages,id',
            'stages.*.order' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        foreach ($request->stages as $stageData) {
            JobStage::where('id', $stageData['id'])->update(['order' => $stageData['order']]);
        }

        return $this->success(JobStage::orderBy('order')->get(), 'Stages reordered successfully');
    }
}
