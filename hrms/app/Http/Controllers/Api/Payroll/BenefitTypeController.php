<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\BenefitType;
use Illuminate\Http\Request;

class BenefitTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = BenefitType::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }
        if ($request->has('taxable')) {
            $query->where('is_taxable', $request->boolean('taxable'));
        }

        $types = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $types]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:benefit_types,title',
            'notes' => 'nullable|string',
            'is_taxable' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $type = BenefitType::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Benefit type created',
            'data' => $type,
        ], 201);
    }

    public function show(BenefitType $benefitType)
    {
        return response()->json([
            'success' => true,
            'data' => $benefitType,
        ]);
    }

    public function update(Request $request, BenefitType $benefitType)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255|unique:benefit_types,title,'.$benefitType->id,
            'notes' => 'nullable|string',
            'is_taxable' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $benefitType->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Benefit type updated',
            'data' => $benefitType->fresh(),
        ]);
    }

    public function destroy(BenefitType $benefitType)
    {
        if ($benefitType->staffBenefits()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete type with existing staff benefits',
            ], 422);
        }

        $benefitType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Benefit type deleted',
        ]);
    }
}
