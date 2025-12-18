<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\BenefitType;
use App\Models\StaffBenefit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Staff Benefit Service
 *
 * Handles all business logic for employee benefit management.
 */
class StaffBenefitService extends BaseService
{
    protected string $modelClass = StaffBenefit::class;

    protected array $defaultRelations = [
        'staffMember',
        'benefitType',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'benefit_type_id' => 'benefit_type_id',
    ];

    /**
     * Get all staff benefits with filtering and pagination.
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
     * Create a staff benefit.
     */
    public function create(array $data): StaffBenefit
    {
        $benefit = StaffBenefit::create($data);

        return $benefit->load($this->defaultRelations);
    }

    /**
     * Update a staff benefit.
     */
    public function update(int|StaffBenefit $benefit, array $data): StaffBenefit
    {
        if (is_int($benefit)) {
            $benefit = $this->findOrFail($benefit);
        }

        $benefit->update($data);

        return $benefit->fresh($this->defaultRelations);
    }

    /**
     * Delete a staff benefit.
     */
    public function delete(int|StaffBenefit $benefit): bool
    {
        if (is_int($benefit)) {
            $benefit = $this->findOrFail($benefit);
        }

        return $benefit->delete();
    }

    /**
     * Get benefits by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->get();
    }

    // ========================================
    // BENEFIT TYPES
    // ========================================

    /**
     * Get all benefit types.
     */
    public function getAllTypes(): Collection
    {
        return BenefitType::orderBy('name')->get();
    }

    /**
     * Create a benefit type.
     */
    public function createType(array $data): BenefitType
    {
        return BenefitType::create($data);
    }

    /**
     * Update a benefit type.
     */
    public function updateType(int $id, array $data): BenefitType
    {
        $type = BenefitType::findOrFail($id);
        $type->update($data);

        return $type->fresh();
    }

    /**
     * Delete a benefit type.
     */
    public function deleteType(int $id): bool
    {
        return BenefitType::findOrFail($id)->delete();
    }

    /**
     * Get types for dropdown.
     */
    public function getTypesForDropdown(): Collection
    {
        return BenefitType::select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }
}
