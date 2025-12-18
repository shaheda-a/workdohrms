<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\FileCategory;
use Illuminate\Http\Request;

class FileCategoryController extends Controller
{
    /**
     * Display a listing of file categories.
     */
    public function index(Request $request)
    {
        $query = FileCategory::query();

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Filter by mandatory status
        if ($request->has('mandatory')) {
            $query->where('is_mandatory', $request->boolean('mandatory'));
        }

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }

        $categories = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Store a newly created file category.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:file_categories,title',
            'notes' => 'nullable|string',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $category = FileCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'File category created successfully',
            'data' => $category,
        ], 201);
    }

    /**
     * Display the specified file category.
     */
    public function show(FileCategory $fileCategory)
    {
        return response()->json([
            'success' => true,
            'data' => $fileCategory,
        ]);
    }

    /**
     * Update the specified file category.
     */
    public function update(Request $request, FileCategory $fileCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:file_categories,title,'.$fileCategory->id,
            'notes' => 'nullable|string',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $fileCategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'File category updated successfully',
            'data' => $fileCategory->fresh(),
        ]);
    }

    /**
     * Remove the specified file category.
     */
    public function destroy(FileCategory $fileCategory)
    {
        $fileCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'File category deleted successfully',
        ]);
    }
}
