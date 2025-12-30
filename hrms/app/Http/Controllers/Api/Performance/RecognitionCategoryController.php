<?php

namespace App\Http\Controllers\Api\Performance;

use App\Http\Controllers\Controller;
use App\Models\RecognitionCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RecognitionCategoryController extends Controller
{
    use ApiResponse;

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

        return $this->success($categories);
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

        return $this->created($category, 'Recognition category created');
    }

    public function show(RecognitionCategory $recognitionCategory)
    {
        return $this->success($recognitionCategory->load('records.staffMember'));
    }

    public function update(Request $request, RecognitionCategory $recognitionCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $recognitionCategory->update($validated);

        return $this->success($recognitionCategory->fresh(), 'Recognition category updated');
    }

    public function destroy(RecognitionCategory $recognitionCategory)
    {
        if ($recognitionCategory->records()->exists()) {
            return $this->error('Cannot delete category with existing records', 422);
        }

        $recognitionCategory->delete();

        return $this->noContent('Recognition category deleted');
    }
}
