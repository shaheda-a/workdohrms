<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCategory::withCount('jobs');

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $categories = $request->paginate === 'false' 
            ? $query->get() 
            : $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $category = JobCategory::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Job category created successfully',
            'data' => $category
        ], 201);
    }

    public function show(JobCategory $jobCategory)
    {
        $jobCategory->load('jobs');
        return response()->json([
            'success' => true,
            'data' => $jobCategory
        ]);
    }

    public function update(Request $request, JobCategory $jobCategory)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $jobCategory->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Job category updated successfully',
            'data' => $jobCategory
        ]);
    }

    public function destroy(JobCategory $jobCategory)
    {
        $jobCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job category deleted successfully'
        ]);
    }
}
