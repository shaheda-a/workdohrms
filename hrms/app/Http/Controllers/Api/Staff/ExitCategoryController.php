<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\ExitCategory;
use Illuminate\Http\Request;

class ExitCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ExitCategory::query();

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
            'title' => 'required|string|max:255|unique:exit_categories,title',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = ExitCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Exit category created',
            'data' => $category,
        ], 201);
    }

    public function show(ExitCategory $exitCategory)
    {
        return response()->json([
            'success' => true,
            'data' => $exitCategory,
        ]);
    }

    public function update(Request $request, ExitCategory $exitCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:exit_categories,title,'.$exitCategory->id,
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $exitCategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Exit category updated',
            'data' => $exitCategory->fresh(),
        ]);
    }

    public function destroy(ExitCategory $exitCategory)
    {
        if ($exitCategory->offboardings()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with existing offboardings',
            ], 422);
        }

        $exitCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Exit category deleted',
        ]);
    }
}
