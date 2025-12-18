<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\AdvanceType;
use App\Models\CompensationCategory;
use App\Models\EmployerContribution;
use App\Models\WithholdingType;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Employer Contribution Service
 *
 * Handles all business logic for employer contribution and related type management.
 */
class EmployerContributionService extends BaseService
{
    protected string $modelClass = EmployerContribution::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'contribution_type' => 'contribution_type',
    ];

    /**
     * Get all employer contributions with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an employer contribution.
     */
    public function create(array $data): EmployerContribution
    {
        $contribution = EmployerContribution::create($data);

        return $contribution->load($this->defaultRelations);
    }

    /**
     * Update an employer contribution.
     */
    public function update(int|EmployerContribution $contribution, array $data): EmployerContribution
    {
        if (is_int($contribution)) {
            $contribution = $this->findOrFail($contribution);
        }

        $contribution->update($data);

        return $contribution->fresh($this->defaultRelations);
    }

    /**
     * Delete an employer contribution.
     */
    public function delete(int|EmployerContribution $contribution): bool
    {
        if (is_int($contribution)) {
            $contribution = $this->findOrFail($contribution);
        }

        return $contribution->delete();
    }

    /**
     * Get contributions by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->get();
    }

    // ========================================
    // WITHHOLDING TYPES
    // ========================================

    /**
     * Get all withholding types.
     */
    public function getAllWithholdingTypes(): Collection
    {
        return WithholdingType::orderBy('name')->get();
    }

    /**
     * Create a withholding type.
     */
    public function createWithholdingType(array $data): WithholdingType
    {
        return WithholdingType::create($data);
    }

    /**
     * Update a withholding type.
     */
    public function updateWithholdingType(int $id, array $data): WithholdingType
    {
        $type = WithholdingType::findOrFail($id);
        $type->update($data);

        return $type->fresh();
    }

    /**
     * Delete a withholding type.
     */
    public function deleteWithholdingType(int $id): bool
    {
        return WithholdingType::findOrFail($id)->delete();
    }

    // ========================================
    // COMPENSATION CATEGORIES
    // ========================================

    /**
     * Get all compensation categories.
     */
    public function getAllCompensationCategories(): Collection
    {
        return CompensationCategory::orderBy('name')->get();
    }

    /**
     * Create a compensation category.
     */
    public function createCompensationCategory(array $data): CompensationCategory
    {
        return CompensationCategory::create($data);
    }

    /**
     * Update a compensation category.
     */
    public function updateCompensationCategory(int $id, array $data): CompensationCategory
    {
        $category = CompensationCategory::findOrFail($id);
        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete a compensation category.
     */
    public function deleteCompensationCategory(int $id): bool
    {
        return CompensationCategory::findOrFail($id)->delete();
    }

    // ========================================
    // ADVANCE TYPES
    // ========================================

    /**
     * Get all advance types.
     */
    public function getAllAdvanceTypes(): Collection
    {
        return AdvanceType::orderBy('name')->get();
    }

    /**
     * Create an advance type.
     */
    public function createAdvanceType(array $data): AdvanceType
    {
        return AdvanceType::create($data);
    }

    /**
     * Update an advance type.
     */
    public function updateAdvanceType(int $id, array $data): AdvanceType
    {
        $type = AdvanceType::findOrFail($id);
        $type->update($data);

        return $type->fresh();
    }

    /**
     * Delete an advance type.
     */
    public function deleteAdvanceType(int $id): bool
    {
        return AdvanceType::findOrFail($id)->delete();
    }
}
