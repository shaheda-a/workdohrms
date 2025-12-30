<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\AdvanceType;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AdvanceTypeController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = AdvanceType::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $types = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($types);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:advance_types,title',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $type = AdvanceType::create($validated);

        return $this->created($type, 'Advance type created');
    }

    public function show(AdvanceType $advanceType)
    {
        return $this->success($advanceType);
    }

    public function update(Request $request, AdvanceType $advanceType)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:advance_types,title,'.$advanceType->id,
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $advanceType->update($validated);

        return $this->success($advanceType->fresh(), 'Advance type updated');
    }

    public function destroy(AdvanceType $advanceType)
    {
        if ($advanceType->salaryAdvances()->exists()) {
            return $this->error('Cannot delete type with existing advances', 422);
        }

        $advanceType->delete();

        return $this->noContent('Advance type deleted');
    }
}
