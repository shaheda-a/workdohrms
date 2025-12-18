<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\MinimumTaxLimit;
use App\Models\TaxExemption;
use App\Models\TaxSlab;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Tax Service
 *
 * Handles all business logic for tax management.
 */
class TaxService extends BaseService
{
    protected string $modelClass = TaxSlab::class;

    /**
     * Get all tax slabs.
     */
    public function getAllSlabs(array $params = []): LengthAwarePaginator|Collection
    {
        $query = TaxSlab::query()->orderBy('income_from');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a tax slab.
     */
    public function createSlab(array $data): TaxSlab
    {
        return TaxSlab::create($data);
    }

    /**
     * Update a tax slab.
     */
    public function updateSlab(int $id, array $data): TaxSlab
    {
        $slab = TaxSlab::findOrFail($id);
        $slab->update($data);

        return $slab->fresh();
    }

    /**
     * Delete a tax slab.
     */
    public function deleteSlab(int $id): bool
    {
        return TaxSlab::findOrFail($id)->delete();
    }

    /**
     * Calculate tax for given income.
     */
    public function calculateTax(float $annualIncome): array
    {
        $slabs = TaxSlab::orderBy('income_from')->get();
        $totalTax = 0;
        $breakdown = [];

        foreach ($slabs as $slab) {
            if ($annualIncome <= $slab->income_from) {
                break;
            }

            $taxableInSlab = min($annualIncome, $slab->income_to ?? $annualIncome) - $slab->income_from;

            if ($taxableInSlab > 0) {
                $slabTax = ($slab->fixed_amount ?? 0) + ($taxableInSlab * ($slab->percentage / 100));
                $totalTax += $slabTax;
                $breakdown[] = [
                    'slab' => "{$slab->income_from} - ".($slab->income_to ?? 'above'),
                    'taxable_amount' => $taxableInSlab,
                    'percentage' => $slab->percentage,
                    'tax' => $slabTax,
                ];
            }
        }

        return [
            'annual_income' => $annualIncome,
            'total_tax' => $totalTax,
            'effective_rate' => $annualIncome > 0 ? round(($totalTax / $annualIncome) * 100, 2) : 0,
            'breakdown' => $breakdown,
        ];
    }

    // ========================================
    // TAX EXEMPTIONS
    // ========================================

    /**
     * Get all tax exemptions.
     */
    public function getAllExemptions(): Collection
    {
        return TaxExemption::orderBy('name')->get();
    }

    /**
     * Create a tax exemption.
     */
    public function createExemption(array $data): TaxExemption
    {
        return TaxExemption::create($data);
    }

    /**
     * Update a tax exemption.
     */
    public function updateExemption(int $id, array $data): TaxExemption
    {
        $exemption = TaxExemption::findOrFail($id);
        $exemption->update($data);

        return $exemption->fresh();
    }

    /**
     * Delete a tax exemption.
     */
    public function deleteExemption(int $id): bool
    {
        return TaxExemption::findOrFail($id)->delete();
    }

    // ========================================
    // MINIMUM TAX LIMITS
    // ========================================

    /**
     * Get all minimum tax limits.
     */
    public function getAllMinimumLimits(): Collection
    {
        return MinimumTaxLimit::orderBy('effective_from', 'desc')->get();
    }

    /**
     * Create a minimum tax limit.
     */
    public function createMinimumLimit(array $data): MinimumTaxLimit
    {
        return MinimumTaxLimit::create($data);
    }

    /**
     * Update a minimum tax limit.
     */
    public function updateMinimumLimit(int $id, array $data): MinimumTaxLimit
    {
        $limit = MinimumTaxLimit::findOrFail($id);
        $limit->update($data);

        return $limit->fresh();
    }

    /**
     * Delete a minimum tax limit.
     */
    public function deleteMinimumLimit(int $id): bool
    {
        return MinimumTaxLimit::findOrFail($id)->delete();
    }

    /**
     * Get current minimum tax limit.
     */
    public function getCurrentMinimumLimit(): ?MinimumTaxLimit
    {
        return MinimumTaxLimit::where('effective_from', '<=', now())
            ->orderBy('effective_from', 'desc')
            ->first();
    }
}
