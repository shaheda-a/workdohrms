<?php

namespace App\Services;

use App\Models\SalarySlip;
use App\Models\StaffMember;
use App\Models\StaffBenefit;
use App\Models\RecurringDeduction;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Payroll Service
 * 
 * Handles all business logic for payroll processing.
 */
class PayrollService extends BaseService
{
    protected string $modelClass = SalarySlip::class;

    protected array $defaultRelations = [
        'staffMember',
        'staffMember.jobTitle',
        'staffMember.division',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all salary slips.
     */
    public function getAllSalarySlips(array $params = [])
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        // Month/Year filter
        if (!empty($params['month']) && !empty($params['year'])) {
            $query->where('salary_month', $params['month'])
                  ->where('salary_year', $params['year']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate 
            ? $query->paginate($perPage) 
            : $query->get();
    }

    /**
     * Generate salary slip for an employee.
     */
    public function generateSalarySlip(int $staffMemberId, int $month, int $year): SalarySlip
    {
        return DB::transaction(function () use ($staffMemberId, $month, $year) {
            // Check if slip already exists
            $existing = SalarySlip::where('staff_member_id', $staffMemberId)
                ->where('salary_month', $month)
                ->where('salary_year', $year)
                ->first();

            if ($existing) {
                return $existing;
            }

            $employee = StaffMember::with(['jobTitle'])->findOrFail($staffMemberId);
            
            // Calculate components
            $baseSalary = $employee->base_salary ?? 0;
            $benefits = $this->calculateBenefits($staffMemberId, $month, $year);
            $deductions = $this->calculateDeductions($staffMemberId, $month, $year);
            $netSalary = $baseSalary + $benefits['total'] - $deductions['total'];

            return SalarySlip::create([
                'staff_member_id' => $staffMemberId,
                'salary_month' => $month,
                'salary_year' => $year,
                'basic_salary' => $baseSalary,
                'allowances' => $benefits['total'],
                'allowances_breakdown' => $benefits['breakdown'],
                'deductions' => $deductions['total'],
                'deductions_breakdown' => $deductions['breakdown'],
                'gross_salary' => $baseSalary + $benefits['total'],
                'net_salary' => $netSalary,
                'status' => 'generated',
                'generated_at' => now(),
            ]);
        });
    }

    /**
     * Bulk generate salary slips for all employees.
     */
    public function bulkGenerateSalarySlips(int $month, int $year, ?array $employeeIds = null): Collection
    {
        return DB::transaction(function () use ($month, $year, $employeeIds) {
            $query = StaffMember::active();
            
            if ($employeeIds) {
                $query->whereIn('id', $employeeIds);
            }

            $employees = $query->get();
            $generated = collect();

            foreach ($employees as $employee) {
                $slip = $this->generateSalarySlip($employee->id, $month, $year);
                $generated->push($slip);
            }

            return $generated;
        });
    }

    /**
     * Mark salary slip as paid.
     */
    public function markAsPaid(int $salarySlipId, array $data = []): SalarySlip
    {
        $slip = SalarySlip::findOrFail($salarySlipId);

        $slip->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $data['payment_method'] ?? null,
            'payment_reference' => $data['payment_reference'] ?? null,
        ]);

        return $slip->fresh($this->defaultRelations);
    }

    /**
     * Bulk mark salary slips as paid.
     */
    public function bulkMarkAsPaid(array $slipIds, array $data = []): int
    {
        return SalarySlip::whereIn('id', $slipIds)->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $data['payment_method'] ?? null,
            'payment_reference' => $data['payment_reference'] ?? null,
        ]);
    }

    /**
     * Calculate employee benefits.
     */
    public function calculateBenefits(int $staffMemberId, int $month, int $year): array
    {
        $benefits = StaffBenefit::where('staff_member_id', $staffMemberId)
            ->where('is_active', true)
            ->with('benefitType')
            ->get();

        $breakdown = [];
        $total = 0;

        foreach ($benefits as $benefit) {
            $amount = $benefit->amount;
            $breakdown[] = [
                'name' => $benefit->benefitType?->title ?? 'Benefit',
                'amount' => $amount,
            ];
            $total += $amount;
        }

        return [
            'total' => $total,
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Calculate employee deductions.
     */
    public function calculateDeductions(int $staffMemberId, int $month, int $year): array
    {
        $deductions = RecurringDeduction::where('staff_member_id', $staffMemberId)
            ->where('is_active', true)
            ->with('withholdingType')
            ->get();

        $breakdown = [];
        $total = 0;

        foreach ($deductions as $deduction) {
            $amount = $deduction->amount;
            $breakdown[] = [
                'name' => $deduction->withholdingType?->title ?? 'Deduction',
                'amount' => $amount,
            ];
            $total += $amount;
        }

        return [
            'total' => $total,
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Get payroll summary for a month.
     */
    public function getMonthlyPayrollSummary(int $month, int $year): array
    {
        $slips = SalarySlip::where('salary_month', $month)
            ->where('salary_year', $year)
            ->get();

        return [
            'month' => $month,
            'year' => $year,
            'total_employees' => $slips->count(),
            'total_gross_salary' => $slips->sum('gross_salary'),
            'total_allowances' => $slips->sum('allowances'),
            'total_deductions' => $slips->sum('deductions'),
            'total_net_salary' => $slips->sum('net_salary'),
            'paid_count' => $slips->where('status', 'paid')->count(),
            'pending_count' => $slips->where('status', 'generated')->count(),
        ];
    }

    /**
     * Get employee salary history.
     */
    public function getEmployeeSalaryHistory(int $staffMemberId, int $limit = 12): Collection
    {
        return SalarySlip::where('staff_member_id', $staffMemberId)
            ->orderByDesc('salary_year')
            ->orderByDesc('salary_month')
            ->limit($limit)
            ->get();
    }

    /**
     * Get payroll statistics.
     */
    public function getStatistics(): array
    {
        $currentMonth = now()->month;
        $currentYear = now()->year;

        $monthlyData = SalarySlip::where('salary_month', $currentMonth)
            ->where('salary_year', $currentYear)
            ->get();

        return [
            'current_month' => [
                'total_salary' => $monthlyData->sum('net_salary'),
                'employees_paid' => $monthlyData->where('status', 'paid')->count(),
                'employees_pending' => $monthlyData->where('status', 'generated')->count(),
            ],
            'year_to_date' => [
                'total_salary' => SalarySlip::where('salary_year', $currentYear)->sum('net_salary'),
                'total_slips' => SalarySlip::where('salary_year', $currentYear)->count(),
            ],
        ];
    }
}
