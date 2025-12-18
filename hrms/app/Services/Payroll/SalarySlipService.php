<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\SalarySlip;
use App\Models\StaffMember;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Salary Slip Service
 *
 * Handles all business logic for salary slip/payslip management.
 */
class SalarySlipService extends BaseService
{
    protected string $modelClass = SalarySlip::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all salary slips with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['salary_period'])) {
            $query->where('salary_period', $params['salary_period']);
        }

        if (! empty($params['month']) && ! empty($params['year'])) {
            $query->whereMonth('salary_period', $params['month'])
                ->whereYear('salary_period', $params['year']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Generate a salary slip for an employee.
     */
    public function generate(int $staffMemberId, string $salaryPeriod): SalarySlip
    {
        $staffMember = StaffMember::with(['benefits', 'deductions'])->findOrFail($staffMemberId);

        $existing = SalarySlip::where('staff_member_id', $staffMemberId)
            ->where('salary_period', $salaryPeriod)
            ->first();

        if ($existing) {
            throw new \Exception('Salary slip already exists for this period');
        }

        $baseSalary = $staffMember->base_salary ?? 0;
        $totalEarnings = $baseSalary;
        $totalDeductions = 0;

        if ($staffMember->benefits) {
            foreach ($staffMember->benefits as $benefit) {
                $totalEarnings += $benefit->amount ?? 0;
            }
        }

        if ($staffMember->deductions) {
            foreach ($staffMember->deductions as $deduction) {
                $totalDeductions += $deduction->amount ?? 0;
            }
        }

        $netPayable = $totalEarnings - $totalDeductions;

        $reference = 'SLP-'.date('Ymd', strtotime($salaryPeriod)).'-'.str_pad($staffMemberId, 4, '0', STR_PAD_LEFT);

        return SalarySlip::create([
            'staff_member_id' => $staffMemberId,
            'salary_period' => $salaryPeriod,
            'reference' => $reference,
            'base_salary' => $baseSalary,
            'total_earnings' => $totalEarnings,
            'total_deductions' => $totalDeductions,
            'net_payable' => $netPayable,
            'status' => 'generated',
        ]);
    }

    /**
     * Bulk generate salary slips.
     */
    public function bulkGenerate(array $staffMemberIds, string $salaryPeriod): Collection
    {
        return DB::transaction(function () use ($staffMemberIds, $salaryPeriod) {
            $slips = collect();
            foreach ($staffMemberIds as $staffMemberId) {
                try {
                    $slip = $this->generate($staffMemberId, $salaryPeriod);
                    $slips->push($slip);
                } catch (\Exception $e) {
                    continue;
                }
            }

            return $slips;
        });
    }

    /**
     * Update a salary slip.
     */
    public function update(int|SalarySlip $slip, array $data): SalarySlip
    {
        if (is_int($slip)) {
            $slip = $this->findOrFail($slip);
        }

        $slip->update($data);

        return $slip->fresh($this->defaultRelations);
    }

    /**
     * Delete a salary slip.
     */
    public function delete(int|SalarySlip $slip): bool
    {
        if (is_int($slip)) {
            $slip = $this->findOrFail($slip);
        }

        return $slip->delete();
    }

    /**
     * Mark salary slip as paid.
     */
    public function markPaid(int|SalarySlip $slip): SalarySlip
    {
        if (is_int($slip)) {
            $slip = $this->findOrFail($slip);
        }

        $slip->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return $slip->fresh($this->defaultRelations);
    }

    /**
     * Get salary slips by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('salary_period', 'desc')
            ->get();
    }

    /**
     * Get salary slip by reference.
     */
    public function getByReference(string $reference): ?SalarySlip
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('reference', $reference)
            ->first();
    }
}
