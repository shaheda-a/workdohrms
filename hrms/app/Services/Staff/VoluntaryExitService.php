<?php

namespace App\Services\Staff;
use App\Services\Core\BaseService;

use App\Models\ExitCategory;
use App\Models\VoluntaryExit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Voluntary Exit Service
 *
 * Handles all business logic for voluntary exit/resignation management.
 */
class VoluntaryExitService extends BaseService
{
    protected string $modelClass = VoluntaryExit::class;

    protected array $defaultRelations = [
        'staffMember',
        'exitCategory',
        'approvedBy',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'exit_category_id' => 'exit_category_id',
        'status' => 'status',
    ];

    /**
     * Get all voluntary exits with filtering and pagination.
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
     * Create a voluntary exit request.
     */
    public function create(array $data): VoluntaryExit
    {
        $data['status'] = $data['status'] ?? 'pending';
        $exit = VoluntaryExit::create($data);

        return $exit->load($this->defaultRelations);
    }

    /**
     * Update a voluntary exit.
     */
    public function update(int|VoluntaryExit $exit, array $data): VoluntaryExit
    {
        if (is_int($exit)) {
            $exit = $this->findOrFail($exit);
        }

        $exit->update($data);

        return $exit->fresh($this->defaultRelations);
    }

    /**
     * Delete a voluntary exit.
     */
    public function delete(int|VoluntaryExit $exit): bool
    {
        if (is_int($exit)) {
            $exit = $this->findOrFail($exit);
        }

        return $exit->delete();
    }

    /**
     * Approve a voluntary exit.
     */
    public function approve(int|VoluntaryExit $exit, int $approvedById): VoluntaryExit
    {
        if (is_int($exit)) {
            $exit = $this->findOrFail($exit);
        }

        $exit->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $exit->fresh($this->defaultRelations);
    }

    /**
     * Reject a voluntary exit.
     */
    public function reject(int|VoluntaryExit $exit, ?string $reason = null): VoluntaryExit
    {
        if (is_int($exit)) {
            $exit = $this->findOrFail($exit);
        }

        $exit->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $exit->fresh($this->defaultRelations);
    }

    /**
     * Complete exit process.
     */
    public function complete(int|VoluntaryExit $exit): VoluntaryExit
    {
        if (is_int($exit)) {
            $exit = $this->findOrFail($exit);
        }

        $exit->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $exit->staffMember->update([
            'employment_status' => 'terminated',
            'termination_date' => $exit->last_working_day,
        ]);

        return $exit->fresh($this->defaultRelations);
    }

    /**
     * Get exits by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    // ========================================
    // EXIT CATEGORIES
    // ========================================

    /**
     * Get all exit categories.
     */
    public function getAllCategories(): Collection
    {
        return ExitCategory::orderBy('name')->get();
    }

    /**
     * Create an exit category.
     */
    public function createCategory(array $data): ExitCategory
    {
        return ExitCategory::create($data);
    }

    /**
     * Update an exit category.
     */
    public function updateCategory(int $id, array $data): ExitCategory
    {
        $category = ExitCategory::findOrFail($id);
        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete an exit category.
     */
    public function deleteCategory(int $id): bool
    {
        return ExitCategory::findOrFail($id)->delete();
    }

    /**
     * Get categories for dropdown.
     */
    public function getCategoriesForDropdown(): Collection
    {
        return ExitCategory::select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }
}
