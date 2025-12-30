<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\ExitCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ExitCategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = ExitCategory::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $categories = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:exit_categories,title',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = ExitCategory::create($validated);

        return $this->created($category, 'Exit category created');
    }

    public function show(ExitCategory $exitCategory)
    {
        return $this->success($exitCategory);
    }

    public function update(Request $request, ExitCategory $exitCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:exit_categories,title,'.$exitCategory->id,
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $exitCategory->update($validated);

        return $this->success($exitCategory->fresh(), 'Exit category updated');
    }

    public function destroy(ExitCategory $exitCategory)
    {
        if ($exitCategory->offboardings()->exists()) {
            return $this->error('Cannot delete category with existing offboardings', 422);
        }

        $exitCategory->delete();

        return $this->noContent('Exit category deleted');
    }
}
