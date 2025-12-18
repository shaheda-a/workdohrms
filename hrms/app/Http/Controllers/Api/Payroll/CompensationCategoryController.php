<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\CompensationCategory;
use Illuminate\Http\Request;

class CompensationCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = CompensationCategory::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $categories = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:compensation_categories,title',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = CompensationCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Compensation category created',
            'data' => $category,
        ], 201);
    }

    public function show(CompensationCategory $compensationCategory)
    {
        return response()->json([
            'success' => true,
            'data' => $compensationCategory,
        ]);
    }

    public function update(Request $request, CompensationCategory $compensationCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:compensation_categories,title,'.$compensationCategory->id,
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $compensationCategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Compensation category updated',
            'data' => $compensationCategory->fresh(),
        ]);
    }

    public function destroy(CompensationCategory $compensationCategory)
    {
        $compensationCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Compensation category deleted',
        ]);
    }
}
