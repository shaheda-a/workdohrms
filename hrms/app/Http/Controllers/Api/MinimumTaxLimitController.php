<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MinimumTaxLimit;
use Illuminate\Http\Request;

class MinimumTaxLimitController extends Controller
{
    public function index(Request $request)
    {
        $query = MinimumTaxLimit::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $limits = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $limits]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'threshold_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $limit = MinimumTaxLimit::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Minimum tax limit created',
            'data' => $limit,
        ], 201);
    }

    public function show(MinimumTaxLimit $minimumTaxLimit)
    {
        return response()->json([
            'success' => true,
            'data' => $minimumTaxLimit,
        ]);
    }

    public function update(Request $request, MinimumTaxLimit $minimumTaxLimit)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'threshold_amount' => 'sometimes|required|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $minimumTaxLimit->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Minimum tax limit updated',
            'data' => $minimumTaxLimit->fresh(),
        ]);
    }

    public function destroy(MinimumTaxLimit $minimumTaxLimit)
    {
        $minimumTaxLimit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Minimum tax limit deleted',
        ]);
    }
}
