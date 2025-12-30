<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\BenefitType;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BenefitTypeController extends Controller
{
    use ApiResponse;

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

        return $this->success($types);
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

        return $this->created($type, 'Benefit type created');
    }

    public function show(BenefitType $benefitType)
    {
        return $this->success($benefitType);
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

        return $this->success($benefitType->fresh(), 'Benefit type updated');
    }

    public function destroy(BenefitType $benefitType)
    {
        if ($benefitType->staffBenefits()->exists()) {
            return $this->error('Cannot delete type with existing staff benefits', 422);
        }

        $benefitType->delete();

        return $this->noContent('Benefit type deleted');
    }
}
