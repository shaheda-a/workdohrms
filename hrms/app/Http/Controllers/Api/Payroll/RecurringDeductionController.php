<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\RecurringDeduction;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class RecurringDeductionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = RecurringDeduction::with(['staffMember', 'withholdingType', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('withholding_type_id')) {
            $query->where('withholding_type_id', $request->withholding_type_id);
        }
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $deductions = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($deductions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'withholding_type_id' => 'required|exists:withholding_types,id',
            'description' => 'required|string|max:255',
            'calculation_type' => 'required|in:fixed,percentage',
            'amount' => 'required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after:effective_from',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        $deduction = RecurringDeduction::create($validated);

        return $this->created($deduction->load(['staffMember', 'withholdingType']), 'Recurring deduction created');
    }

    public function update(Request $request, RecurringDeduction $recurringDeduction)
    {
        $validated = $request->validate([
            'withholding_type_id' => 'sometimes|required|exists:withholding_types,id',
            'description' => 'sometimes|required|string|max:255',
            'calculation_type' => 'sometimes|required|in:fixed,percentage',
            'amount' => 'sometimes|required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $recurringDeduction->update($validated);

        return $this->success($recurringDeduction->fresh(['staffMember', 'withholdingType']), 'Recurring deduction updated');
    }

    public function destroy(RecurringDeduction $recurringDeduction)
    {
        $recurringDeduction->delete();

        return $this->noContent('Recurring deduction deleted');
    }
}
