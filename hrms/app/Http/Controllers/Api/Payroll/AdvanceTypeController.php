<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\AdvanceType;
use Illuminate\Http\Request;

class AdvanceTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = AdvanceType::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $types = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $types]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:advance_types,title',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $type = AdvanceType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Advance type created',
            'data' => $type,
        ], 201);
    }

    public function show(AdvanceType $advanceType)
    {
        return response()->json([
            'success' => true,
            'data' => $advanceType,
        ]);
    }

    public function update(Request $request, AdvanceType $advanceType)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:advance_types,title,'.$advanceType->id,
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $advanceType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Advance type updated',
            'data' => $advanceType->fresh(),
        ]);
    }

    public function destroy(AdvanceType $advanceType)
    {
        if ($advanceType->salaryAdvances()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete type with existing advances',
            ], 422);
        }

        $advanceType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Advance type deleted',
        ]);
    }
}
