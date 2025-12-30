<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\MinimumTaxLimit;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class MinimumTaxLimitController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = MinimumTaxLimit::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $limits = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($limits);
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

        return $this->created($limit, 'Minimum tax limit created');
    }

    public function show(MinimumTaxLimit $minimumTaxLimit)
    {
        return $this->success($minimumTaxLimit);
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

        return $this->success($minimumTaxLimit->fresh(), 'Minimum tax limit updated');
    }

    public function destroy(MinimumTaxLimit $minimumTaxLimit)
    {
        $minimumTaxLimit->delete();

        return $this->noContent('Minimum tax limit deleted');
    }
}
