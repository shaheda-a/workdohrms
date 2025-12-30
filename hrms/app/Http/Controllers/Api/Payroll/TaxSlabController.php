<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\TaxSlab;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TaxSlabController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = TaxSlab::with('author');

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $slabs = $query->orderBy('income_from')->get();

        return response()->json(['success' => true, 'data' => $slabs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'income_from' => 'required|numeric|min:0',
            'income_to' => 'required|numeric|gt:income_from',
            'fixed_amount' => 'nullable|numeric|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        $slab = TaxSlab::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tax slab created',
            'data' => $slab,
        ], 201);
    }

    public function show(TaxSlab $taxSlab)
    {
        return response()->json([
            'success' => true,
            'data' => $taxSlab->load('author'),
        ]);
    }

    public function update(Request $request, TaxSlab $taxSlab)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'income_from' => 'sometimes|required|numeric|min:0',
            'income_to' => 'sometimes|required|numeric',
            'fixed_amount' => 'nullable|numeric|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $taxSlab->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tax slab updated',
            'data' => $taxSlab->fresh(),
        ]);
    }

    public function destroy(TaxSlab $taxSlab)
    {
        $taxSlab->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tax slab deleted',
        ]);
    }

    /**
     * Calculate tax for a given income.
     */
    public function calculate(Request $request)
    {
        $validated = $request->validate([
            'income' => 'required|numeric|min:0',
        ]);

        $income = $validated['income'];
        $slab = TaxSlab::active()->forIncome($income)->first();

        if (! $slab) {
            return response()->json([
                'success' => true,
                'data' => [
                    'income' => $income,
                    'tax' => 0,
                    'slab' => null,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'income' => $income,
                'tax' => $slab->calculateTax($income),
                'slab' => $slab,
            ],
        ]);
    }
}
