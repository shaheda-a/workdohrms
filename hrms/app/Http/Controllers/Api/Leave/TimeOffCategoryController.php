<?php

namespace App\Http\Controllers\Api\Leave;

use App\Http\Controllers\Controller;
use App\Models\TimeOffCategory;
use Illuminate\Http\Request;

class TimeOffCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = TimeOffCategory::with('author');

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }
        if ($request->has('paid')) {
            $query->where('is_paid', $request->boolean('paid'));
        }

        $categories = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'annual_quota' => 'required|integer|min:0',
            'notes' => 'nullable|string',
            'is_paid' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        $category = TimeOffCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Time off category created',
            'data' => $category,
        ], 201);
    }

    public function show(TimeOffCategory $timeOffCategory)
    {
        return response()->json([
            'success' => true,
            'data' => $timeOffCategory->load('author'),
        ]);
    }

    public function update(Request $request, TimeOffCategory $timeOffCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'annual_quota' => 'sometimes|required|integer|min:0',
            'notes' => 'nullable|string',
            'is_paid' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $timeOffCategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Time off category updated',
            'data' => $timeOffCategory->fresh(),
        ]);
    }

    public function destroy(TimeOffCategory $timeOffCategory)
    {
        if ($timeOffCategory->requests()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with existing requests',
            ], 422);
        }

        $timeOffCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Time off category deleted',
        ]);
    }
}
