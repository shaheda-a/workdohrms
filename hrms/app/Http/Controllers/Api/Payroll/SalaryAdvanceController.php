<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\SalaryAdvance;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SalaryAdvanceController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = SalaryAdvance::with(['staffMember', 'advanceType', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('advance_type_id')) {
            $query->where('advance_type_id', $request->advance_type_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $advances = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($advances);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'advance_type_id' => 'required|exists:advance_types,id',
            'description' => 'required|string|max:255',
            'principal_amount' => 'required|numeric|min:0',
            'monthly_deduction' => 'required|numeric|min:0',
            'issue_date' => 'required|date',
            'start_deduction_date' => 'required|date|after_or_equal:issue_date',
            'notes' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $validated['status'] = 'active';

        // Calculate expected completion date
        if ($validated['monthly_deduction'] > 0) {
            $months = ceil($validated['principal_amount'] / $validated['monthly_deduction']);
            $validated['expected_completion_date'] = now()
                ->parse($validated['start_deduction_date'])
                ->addMonths($months)
                ->toDateString();
        }

        $advance = SalaryAdvance::create($validated);

        return $this->created($advance->load(['staffMember', 'advanceType']), 'Salary advance created');
    }

    public function update(Request $request, SalaryAdvance $salaryAdvance)
    {
        $validated = $request->validate([
            'description' => 'sometimes|required|string|max:255',
            'monthly_deduction' => 'sometimes|required|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'sometimes|required|in:active,completed,cancelled',
        ]);

        $salaryAdvance->update($validated);

        return $this->success($salaryAdvance->fresh(['staffMember', 'advanceType']), 'Salary advance updated');
    }

    /**
     * Record a deduction payment.
     */
    public function recordPayment(Request $request, SalaryAdvance $salaryAdvance)
    {
        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
        ]);

        $salaryAdvance->recordDeduction($validated['amount'] ?? null);

        return $this->success($salaryAdvance->fresh(), 'Payment recorded');
    }

    public function destroy(SalaryAdvance $salaryAdvance)
    {
        $salaryAdvance->delete();

        return $this->noContent('Salary advance deleted');
    }
}
