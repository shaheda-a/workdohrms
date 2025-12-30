<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\JobCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobCategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = JobCategory::withCount('jobs');

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $categories = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return $this->success($categories);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $category = JobCategory::create($request->all());

        return $this->created($category, 'Job category created successfully');
    }

    public function show(JobCategory $jobCategory)
    {
        $jobCategory->load('jobs');

        return $this->success($jobCategory);
    }

    public function update(Request $request, JobCategory $jobCategory)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $jobCategory->update($request->all());

        return $this->success($jobCategory, 'Job category updated successfully');
    }

    public function destroy(JobCategory $jobCategory)
    {
        $jobCategory->delete();

        return $this->noContent('Job category deleted successfully');
    }
}
