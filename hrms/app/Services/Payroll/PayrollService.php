<?php

namespace App\Services\Payroll;

use App\Models\RecurringDeduction;
use App\Models\SalarySlip;
use App\Models\StaffBenefit;
use App\Models\StaffMember;
use App\Services\Core\BaseService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

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

        // Month/Year filter - salary_period format is YYYY-MM
        if (! empty($params['month']) && ! empty($params['year'])) {
            $salaryPeriod = sprintf('%04d-%02d', $params['year'], $params['month']);
            $query->where('salary_period', $salaryPeriod);
        }

        // Direct salary_period filter
        if (! empty($params['salary_period'])) {
            $query->where('salary_period', $params['salary_period']);
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
            $salaryPeriod = sprintf('%04d-%02d', $year, $month);

            // Check if slip already exists
            $existing = SalarySlip::where('staff_member_id', $staffMemberId)
                ->where('salary_period', $salaryPeriod)
                ->first();

            if ($existing) {
                return $existing;
            }

            $employee = StaffMember::with(['jobTitle'])->findOrFail($staffMemberId);

            // Calculate components
            $baseSalary = $employee->base_salary ?? 0;
            $benefits = $this->calculateBenefits($staffMemberId, $month, $year);
            $deductions = $this->calculateDeductions($staffMemberId, $month, $year);
            $totalEarnings = $baseSalary + $benefits['total'];
            $totalDeductions = $deductions['total'];
            $netPayable = $totalEarnings - $totalDeductions;

            return SalarySlip::create([
                'staff_member_id' => $staffMemberId,
                'salary_period' => $salaryPeriod,
                'basic_salary' => $baseSalary,
                'benefits_breakdown' => $benefits['breakdown'],
                'deductions_breakdown' => $deductions['breakdown'],
                'total_earnings' => $totalEarnings,
                'total_deductions' => $totalDeductions,
                'net_payable' => $netPayable,
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
        $salaryPeriod = sprintf('%04d-%02d', $year, $month);
        $slips = SalarySlip::where('salary_period', $salaryPeriod)->get();

        return [
            'month' => $month,
            'year' => $year,
            'salary_period' => $salaryPeriod,
            'total_employees' => $slips->count(),
            'total_earnings' => $slips->sum('total_earnings'),
            'total_deductions' => $slips->sum('total_deductions'),
            'total_net_payable' => $slips->sum('net_payable'),
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
            ->orderByDesc('salary_period')
            ->limit($limit)
            ->get();
    }

    /**
     * Get payroll statistics.
     */
    public function getStatistics(): array
    {
        $currentPeriod = now()->format('Y-m');
        $currentYear = now()->year;

        $monthlyData = SalarySlip::where('salary_period', $currentPeriod)->get();

        return [
            'current_month' => [
                'total_salary' => $monthlyData->sum('net_payable'),
                'employees_paid' => $monthlyData->where('status', 'paid')->count(),
                'employees_pending' => $monthlyData->where('status', 'generated')->count(),
            ],
            'year_to_date' => [
                'total_salary' => SalarySlip::where('salary_period', 'like', $currentYear.'-%')->sum('net_payable'),
                'total_slips' => SalarySlip::where('salary_period', 'like', $currentYear.'-%')->count(),
            ],
        ];
    }

    // App\Services\Payroll\PayrollService.php
public function generateSalarySlipPdf($salarySlip)
{
    // Make sure you have a view at resources/views/pdf/salary-slip.blade.php
    $pdf = PDF::loadView('pdf.salary-slip', [
        'slip' => $salarySlip,
        'company' => \App\Models\Company::first(),
    ]);
    
    // Customize PDF settings
    $pdf->setPaper('A4', 'portrait');
    $pdf->setOptions([
        'isHtml5ParserEnabled' => true,
        'isRemoteEnabled' => true,
    ]);
    
    return $pdf->output();
}
}
