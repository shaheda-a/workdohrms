<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\TaxExemption;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TaxExemptionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = TaxExemption::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $exemptions = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($exemptions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'exemption_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $exemption = TaxExemption::create($validated);

        return $this->created($exemption, 'Tax exemption created');
    }

    public function show(TaxExemption $taxExemption)
    {
        return $this->success($taxExemption);
    }

    public function update(Request $request, TaxExemption $taxExemption)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'exemption_amount' => 'sometimes|required|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $taxExemption->update($validated);

        return $this->success($taxExemption->fresh(), 'Tax exemption updated');
    }

    public function destroy(TaxExemption $taxExemption)
    {
        $taxExemption->delete();

        return $this->noContent('Tax exemption deleted');
    }
}
