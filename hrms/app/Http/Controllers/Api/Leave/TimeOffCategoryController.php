<?php

namespace App\Http\Controllers\Api\Leave;

use App\Http\Controllers\Controller;
use App\Models\TimeOffCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TimeOffCategoryController extends Controller
{
    use ApiResponse;

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

        return $this->success($categories);
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

        return $this->created($category, 'Time off category created');
    }

    public function show(TimeOffCategory $timeOffCategory)
    {
        return $this->success($timeOffCategory->load('author'));
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

        return $this->success($timeOffCategory->fresh(), 'Time off category updated');
    }

    public function destroy(TimeOffCategory $timeOffCategory)
    {
        if ($timeOffCategory->requests()->exists()) {
            return $this->error('Cannot delete category with existing requests', 422);
        }

        $timeOffCategory->delete();

        return $this->noContent('Time off category deleted');
    }
}
