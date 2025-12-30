<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\CompensationCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CompensationCategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = CompensationCategory::query();

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
            'title' => 'required|string|max:255|unique:compensation_categories,title',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = CompensationCategory::create($validated);

        return $this->created($category, 'Compensation category created');
    }

    public function show(CompensationCategory $compensationCategory)
    {
        return $this->success($compensationCategory);
    }

    public function update(Request $request, CompensationCategory $compensationCategory)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:compensation_categories,title,'.$compensationCategory->id,
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $compensationCategory->update($validated);

        return $this->success($compensationCategory->fresh(), 'Compensation category updated');
    }

    public function destroy(CompensationCategory $compensationCategory)
    {
        $compensationCategory->delete();

        return $this->noContent('Compensation category deleted');
    }
}
