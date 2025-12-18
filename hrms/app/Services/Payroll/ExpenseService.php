<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Expense Service
 *
 * Handles all business logic for expense management.
 */
class ExpenseService extends BaseService
{
    protected string $modelClass = Expense::class;

    protected array $defaultRelations = [
        'staffMember',
        'category',
        'approvedBy',
    ];

    protected array $searchableFields = [
        'title',
        'description',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'expense_category_id' => 'category_id',
        'status' => 'status',
    ];

    /**
     * Get all expenses with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('expense_date', [$params['start_date'], $params['end_date']]);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an expense.
     */
    public function create(array $data): Expense
    {
        $data['status'] = $data['status'] ?? 'pending';
        $expense = Expense::create($data);

        return $expense->load($this->defaultRelations);
    }

    /**
     * Update an expense.
     */
    public function update(int|Expense $expense, array $data): Expense
    {
        if (is_int($expense)) {
            $expense = $this->findOrFail($expense);
        }

        $expense->update($data);

        return $expense->fresh($this->defaultRelations);
    }

    /**
     * Delete an expense.
     */
    public function delete(int|Expense $expense): bool
    {
        if (is_int($expense)) {
            $expense = $this->findOrFail($expense);
        }

        if ($expense->receipt_path) {
            Storage::delete($expense->receipt_path);
        }

        return $expense->delete();
    }

    /**
     * Approve an expense.
     */
    public function approve(int|Expense $expense, int $approvedById): Expense
    {
        if (is_int($expense)) {
            $expense = $this->findOrFail($expense);
        }

        $expense->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $expense->fresh($this->defaultRelations);
    }

    /**
     * Reject an expense.
     */
    public function reject(int|Expense $expense, int $rejectedById, ?string $reason = null): Expense
    {
        if (is_int($expense)) {
            $expense = $this->findOrFail($expense);
        }

        $expense->update([
            'status' => 'rejected',
            'approved_by' => $rejectedById,
            'rejection_reason' => $reason,
        ]);

        return $expense->fresh($this->defaultRelations);
    }

    /**
     * Mark expense as reimbursed.
     */
    public function markReimbursed(int|Expense $expense): Expense
    {
        if (is_int($expense)) {
            $expense = $this->findOrFail($expense);
        }

        $expense->update([
            'status' => 'reimbursed',
            'reimbursed_at' => now(),
        ]);

        return $expense->fresh($this->defaultRelations);
    }

    /**
     * Get expenses by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('expense_date', 'desc')
            ->get();
    }

    /**
     * Get pending expenses.
     */
    public function getPending(): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->get();
    }

    // ========================================
    // EXPENSE CATEGORIES
    // ========================================

    /**
     * Get all expense categories.
     */
    public function getAllCategories(): Collection
    {
        return ExpenseCategory::orderBy('name')->get();
    }

    /**
     * Create an expense category.
     */
    public function createCategory(array $data): ExpenseCategory
    {
        return ExpenseCategory::create($data);
    }

    /**
     * Update an expense category.
     */
    public function updateCategory(int $id, array $data): ExpenseCategory
    {
        $category = ExpenseCategory::findOrFail($id);
        $category->update($data);

        return $category->fresh();
    }

    /**
     * Delete an expense category.
     */
    public function deleteCategory(int $id): bool
    {
        return ExpenseCategory::findOrFail($id)->delete();
    }

    /**
     * Get categories for dropdown.
     */
    public function getCategoriesForDropdown(): Collection
    {
        return ExpenseCategory::select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }
}
