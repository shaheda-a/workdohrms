<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\WithholdingType;
use Illuminate\Http\Request;

class WithholdingTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = WithholdingType::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }
        if ($request->has('statutory')) {
            $query->where('is_statutory', $request->boolean('statutory'));
        }

        $types = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $types]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:withholding_types,title',
            'notes' => 'nullable|string',
            'is_statutory' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $type = WithholdingType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Withholding type created',
            'data' => $type,
        ], 201);
    }

    public function show(WithholdingType $withholdingType)
    {
        return response()->json([
            'success' => true,
            'data' => $withholdingType,
        ]);
    }

    public function update(Request $request, WithholdingType $withholdingType)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:withholding_types,title,'.$withholdingType->id,
            'notes' => 'nullable|string',
            'is_statutory' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $withholdingType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Withholding type updated',
            'data' => $withholdingType->fresh(),
        ]);
    }

    public function destroy(WithholdingType $withholdingType)
    {
        if ($withholdingType->recurringDeductions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete type with existing deductions',
            ], 422);
        }

        $withholdingType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Withholding type deleted',
        ]);
    }
}
