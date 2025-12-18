<?php

namespace App\Http\Controllers\Api\Performance;

use App\Http\Controllers\Controller;
use App\Models\RecognitionCategory;
use Illuminate\Http\Request;

class RecognitionCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = RecognitionCategory::with('author');

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
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
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        $category = RecognitionCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Recognition category created',
            'data' => $category,
        ], 201);
    }

    public function show(RecognitionCategory $recognitionCategory)
    {
        return response()->json([
            'success' => true,
            'data' => $recognitionCategory->load('records.staffMember'),
        ]);
    }

    public function update(Request $request, RecognitionCategory $recognitionCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $recognitionCategory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Recognition category updated',
            'data' => $recognitionCategory->fresh(),
        ]);
    }

    public function destroy(RecognitionCategory $recognitionCategory)
    {
        if ($recognitionCategory->records()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with existing records',
            ], 422);
        }

        $recognitionCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Recognition category deleted',
        ]);
    }
}
