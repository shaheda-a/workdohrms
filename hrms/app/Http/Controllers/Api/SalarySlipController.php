<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalarySlip;
use App\Models\StaffMember;
use App\Models\StaffBenefit;
use App\Models\IncentiveRecord;
use App\Models\BonusPayment;
use App\Models\ExtraHoursRecord;
use App\Models\EmployerContribution;
use App\Models\RecurringDeduction;
use App\Models\SalaryAdvance;
use App\Models\TaxSlab;
use App\Models\TaxExemption;
use App\Models\MinimumTaxLimit;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SalarySlipController extends Controller
{
    public function index(Request $request)
    {
        $query = SalarySlip::with(['staffMember', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('salary_period')) {
            $query->forPeriod($request->salary_period);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $slips = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $slips]);
    }

    /**
     * Generate payslip for a staff member for a specific month.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'salary_period' => 'required|date_format:Y-m', // e.g., 2025-12
        ]);

        $staffMember = StaffMember::findOrFail($validated['staff_member_id']);
        $period = $validated['salary_period'];
        $periodStart = Carbon::parse($period . '-01')->startOfMonth();
        $periodEnd = Carbon::parse($period . '-01')->endOfMonth();

        // Check if already exists
        $existing = SalarySlip::where('staff_member_id', $staffMember->id)
            ->where('salary_period', $period)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Salary slip already exists for this period',
                'data' => $existing,
            ], 422);
        }

        // Calculate all components
        $basicSalary = (float) $staffMember->base_salary;

        // Benefits/Allowances
        $benefits = StaffBenefit::where('staff_member_id', $staffMember->id)
            ->active()->currentlyEffective()->get();
        $benefitsBreakdown = $benefits->map(function ($b) use ($basicSalary) {
            return [
                'id' => $b->id,
                'description' => $b->description,
                'type' => $b->calculation_type,
                'rate' => (float) $b->amount,
                'amount' => $b->calculateAmount($basicSalary),
            ];
        })->toArray();
        $totalBenefits = collect($benefitsBreakdown)->sum('amount');

        // Incentives/Commissions
        $incentives = IncentiveRecord::where('staff_member_id', $staffMember->id)
            ->where('period_start', '<=', $periodEnd)
            ->where('period_end', '>=', $periodStart)
            ->get();
        $incentivesBreakdown = $incentives->map(function ($i) use ($basicSalary) {
            return [
                'id' => $i->id,
                'description' => $i->description,
                'type' => $i->calculation_type,
                'rate' => (float) $i->amount,
                'amount' => $i->calculateAmount($basicSalary),
            ];
        })->toArray();
        $totalIncentives = collect($incentivesBreakdown)->sum('amount');

        // Bonus payments
        $bonuses = BonusPayment::where('staff_member_id', $staffMember->id)
            ->whereBetween('payment_date', [$periodStart, $periodEnd])
            ->get();
        $bonusBreakdown = $bonuses->map(function ($b) use ($basicSalary) {
            return [
                'id' => $b->id,
                'title' => $b->title,
                'type' => $b->payment_type,
                'rate' => (float) $b->amount,
                'amount' => $b->calculateAmount($basicSalary),
            ];
        })->toArray();
        $totalBonus = collect($bonusBreakdown)->sum('amount');

        // Overtime
        $overtime = ExtraHoursRecord::where('staff_member_id', $staffMember->id)
            ->where('period_start', '<=', $periodEnd)
            ->where('period_end', '>=', $periodStart)
            ->get();
        $overtimeBreakdown = $overtime->map(function ($o) {
            return [
                'id' => $o->id,
                'title' => $o->title,
                'days' => $o->days_count,
                'hours' => (float) $o->hours_per_day,
                'rate' => (float) $o->hourly_rate,
                'amount' => $o->total_amount,
            ];
        })->toArray();
        $totalOvertime = collect($overtimeBreakdown)->sum('amount');

        // Employer contributions
        $contributions = EmployerContribution::where('staff_member_id', $staffMember->id)
            ->active()->currentlyEffective()->get();
        $contributionsBreakdown = $contributions->map(function ($c) use ($basicSalary) {
            return [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->contribution_type,
                'rate' => (float) $c->amount,
                'amount' => $c->calculateAmount($basicSalary),
            ];
        })->toArray();
        $totalContributions = collect($contributionsBreakdown)->sum('amount');

        // Deductions
        $deductions = RecurringDeduction::where('staff_member_id', $staffMember->id)
            ->active()->currentlyEffective()->get();
        $deductionsBreakdown = $deductions->map(function ($d) use ($basicSalary) {
            return [
                'id' => $d->id,
                'description' => $d->description,
                'type' => $d->calculation_type,
                'rate' => (float) $d->amount,
                'amount' => $d->calculateAmount($basicSalary),
            ];
        })->toArray();
        $totalDeductions = collect($deductionsBreakdown)->sum('amount');

        // Loan deductions
        $advances = SalaryAdvance::where('staff_member_id', $staffMember->id)
            ->readyForDeduction()
            ->get();
        $advancesBreakdown = $advances->map(function ($a) {
            return [
                'id' => $a->id,
                'description' => $a->description,
                'monthly_deduction' => (float) $a->monthly_deduction,
                'remaining_before' => (float) $a->remaining_balance,
            ];
        })->toArray();
        $totalAdvances = collect($advancesBreakdown)->sum('monthly_deduction');

        // Calculate gross earnings
        $grossEarnings = $basicSalary + $totalBenefits + $totalIncentives + 
                         $totalBonus + $totalOvertime + $totalContributions;

        // Calculate tax
        $taxBreakdown = [];
        $totalTax = 0;

        // Check minimum tax threshold
        $threshold = MinimumTaxLimit::active()->first();
        if (!$threshold || $grossEarnings > (float) $threshold->threshold_amount) {
            // Apply exemptions
            $exemptions = TaxExemption::active()->sum('exemption_amount');
            $taxableIncome = max(0, $grossEarnings - $exemptions);

            // Get applicable tax slab
            $taxSlab = TaxSlab::active()
                ->where('income_from', '<=', $taxableIncome)
                ->where('income_to', '>=', $taxableIncome)
                ->first();

            if ($taxSlab) {
                $taxAmount = $taxSlab->calculateTax($taxableIncome);
                $taxBreakdown = [
                    'gross_earnings' => $grossEarnings,
                    'exemptions' => (float) $exemptions,
                    'taxable_income' => $taxableIncome,
                    'slab' => $taxSlab->title,
                    'fixed' => (float) $taxSlab->fixed_amount,
                    'percentage' => (float) $taxSlab->percentage,
                    'tax_amount' => $taxAmount,
                ];
                $totalTax = $taxAmount;
            }
        }

        // Calculate totals
        $totalEarnings = $grossEarnings;
        $totalAllDeductions = $totalDeductions + $totalAdvances + $totalTax;
        $netPayable = $totalEarnings - $totalAllDeductions;

        // Create salary slip
        $slip = SalarySlip::create([
            'staff_member_id' => $staffMember->id,
            'salary_period' => $period,
            'basic_salary' => $basicSalary,
            'benefits_breakdown' => $benefitsBreakdown,
            'incentives_breakdown' => $incentivesBreakdown,
            'bonus_breakdown' => $bonusBreakdown,
            'overtime_breakdown' => $overtimeBreakdown,
            'contributions_breakdown' => $contributionsBreakdown,
            'deductions_breakdown' => $deductionsBreakdown,
            'advances_breakdown' => $advancesBreakdown,
            'tax_breakdown' => $taxBreakdown,
            'total_earnings' => $totalEarnings,
            'total_deductions' => $totalAllDeductions,
            'net_payable' => $netPayable,
            'status' => 'generated',
            'generated_at' => now(),
            'author_id' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Salary slip generated successfully',
            'data' => $slip->load('staffMember'),
        ], 201);
    }

    /**
     * Bulk generate payslips for all active staff.
     */
    public function bulkGenerate(Request $request)
    {
        $validated = $request->validate([
            'salary_period' => 'required|date_format:Y-m',
        ]);

        $period = $validated['salary_period'];
        $staffMembers = StaffMember::active()->get();
        
        $generated = 0;
        $skipped = 0;
        $errors = [];

        foreach ($staffMembers as $staff) {
            // Skip if already exists
            if (SalarySlip::where('staff_member_id', $staff->id)
                ->where('salary_period', $period)->exists()) {
                $skipped++;
                continue;
            }

            try {
                $fakeRequest = new Request([
                    'staff_member_id' => $staff->id,
                    'salary_period' => $period,
                ]);
                $fakeRequest->setUserResolver(fn() => $request->user());
                
                $this->generate($fakeRequest);
                $generated++;
            } catch (\Exception $e) {
                $errors[] = ['staff_id' => $staff->id, 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Generated: {$generated}, Skipped: {$skipped}",
            'data' => [
                'generated' => $generated,
                'skipped' => $skipped,
                'errors' => $errors,
            ],
        ]);
    }

    public function show(SalarySlip $salarySlip)
    {
        return response()->json([
            'success' => true,
            'data' => $salarySlip->load(['staffMember.officeLocation', 'staffMember.division', 'staffMember.jobTitle', 'author']),
        ]);
    }

    /**
     * Mark payslip as paid.
     */
    public function markPaid(Request $request, SalarySlip $salarySlip)
    {
        $salarySlip->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Process loan deductions
        if (!empty($salarySlip->advances_breakdown)) {
            foreach ($salarySlip->advances_breakdown as $adv) {
                $advance = SalaryAdvance::find($adv['id']);
                if ($advance) {
                    $advance->recordDeduction($adv['monthly_deduction']);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Salary slip marked as paid',
            'data' => $salarySlip->fresh(),
        ]);
    }

    public function destroy(SalarySlip $salarySlip)
    {
        if ($salarySlip->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a paid salary slip',
            ], 422);
        }

        $salarySlip->delete();

        return response()->json([
            'success' => true,
            'message' => 'Salary slip deleted',
        ]);
    }
}
