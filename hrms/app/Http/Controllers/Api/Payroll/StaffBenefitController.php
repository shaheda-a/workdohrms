<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\StaffBenefit;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class StaffBenefitController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = StaffBenefit::with(['staffMember', 'benefitType', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('benefit_type_id')) {
            $query->where('benefit_type_id', $request->benefit_type_id);
        }
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $benefits = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($benefits);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'benefit_type_id' => 'required|exists:benefit_types,id',
            'description' => 'required|string|max:255',
            'calculation_type' => 'required|in:fixed,percentage',
            'amount' => 'required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after:effective_from',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        $benefit = StaffBenefit::create($validated);

        return $this->created($benefit->load(['staffMember', 'benefitType']), 'Staff benefit created');
    }

    public function update(Request $request, StaffBenefit $staffBenefit)
    {
        $validated = $request->validate([
            'benefit_type_id' => 'sometimes|required|exists:benefit_types,id',
            'description' => 'sometimes|required|string|max:255',
            'calculation_type' => 'sometimes|required|in:fixed,percentage',
            'amount' => 'sometimes|required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $staffBenefit->update($validated);

        return $this->success($staffBenefit->fresh(['staffMember', 'benefitType']), 'Staff benefit updated');
    }

    public function destroy(StaffBenefit $staffBenefit)
    {
        $staffBenefit->delete();

        return $this->noContent('Staff benefit deleted');
    }
}
