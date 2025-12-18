<?php

namespace App\Services;

use App\Models\TimeOffRequest;
use App\Models\TimeOffCategory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Leave Service
 * 
 * Handles all business logic for leave/time-off management.
 */
class LeaveService extends BaseService
{
    protected string $modelClass = TimeOffRequest::class;

    protected array $defaultRelations = [
        'staffMember',
        'category',
        'approver',
    ];

    protected array $searchableFields = [
        'reason',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'time_off_category_id' => 'category_id',
        'status' => 'status',
    ];

    /**
     * Get all leave requests with filters.
     */
    public function getAllRequests(array $params = [])
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (!empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        // Date range filter
        if (!empty($params['start_date'])) {
            $query->where('start_date', '>=', $params['start_date']);
        }
        if (!empty($params['end_date'])) {
            $query->where('end_date', '<=', $params['end_date']);
        }

        // Month/Year filter
        if (!empty($params['month']) && !empty($params['year'])) {
            $query->whereMonth('start_date', $params['month'])
                  ->whereYear('start_date', $params['year']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate 
            ? $query->paginate($perPage) 
            : $query->get();
    }

    /**
     * Create a new leave request.
     */
    public function createRequest(array $data): TimeOffRequest
    {
        return DB::transaction(function () use ($data) {
            // Calculate total days
            $startDate = Carbon::parse($data['start_date']);
            $endDate = Carbon::parse($data['end_date']);
            $data['total_days'] = $startDate->diffInDays($endDate) + 1;
            
            $data['status'] = 'pending';
            
            return TimeOffRequest::create($data);
        });
    }

    /**
     * Approve a leave request.
     */
    public function approve(int|TimeOffRequest $request, int $approverId, ?string $notes = null): TimeOffRequest
    {
        if (is_int($request)) {
            $request = $this->findOrFail($request);
        }

        return DB::transaction(function () use ($request, $approverId, $notes) {
            $request->update([
                'status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
                'approval_notes' => $notes,
            ]);

            // Deduct leave balance if tracking is enabled
            $this->deductLeaveBalance($request);

            return $request->fresh($this->defaultRelations);
        });
    }

    /**
     * Reject a leave request.
     */
    public function reject(int|TimeOffRequest $request, int $approverId, ?string $reason = null): TimeOffRequest
    {
        if (is_int($request)) {
            $request = $this->findOrFail($request);
        }

        $request->update([
            'status' => 'rejected',
            'approved_by' => $approverId,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return $request->fresh($this->defaultRelations);
    }

    /**
     * Cancel a leave request.
     */
    public function cancel(int|TimeOffRequest $request): TimeOffRequest
    {
        if (is_int($request)) {
            $request = $this->findOrFail($request);
        }

        // Restore balance if it was deducted
        if ($request->status === 'approved') {
            $this->restoreLeaveBalance($request);
        }

        $request->update(['status' => 'cancelled']);

        return $request->fresh($this->defaultRelations);
    }

    /**
     * Get pending requests.
     */
    public function getPendingRequests(array $params = [])
    {
        $params['status'] = 'pending';
        return $this->getAllRequests($params);
    }

    /**
     * Get requests for a specific employee.
     */
    public function getEmployeeRequests(int $staffMemberId, array $params = [])
    {
        $params['staff_member_id'] = $staffMemberId;
        return $this->getAllRequests($params);
    }

    /**
     * Get leave balance for an employee.
     */
    public function getLeaveBalance(int $staffMemberId, ?int $year = null): array
    {
        $year = $year ?? now()->year;

        $categories = TimeOffCategory::active()->get();
        $balances = [];

        foreach ($categories as $category) {
            $used = TimeOffRequest::where('staff_member_id', $staffMemberId)
                ->where('time_off_category_id', $category->id)
                ->where('status', 'approved')
                ->whereYear('start_date', $year)
                ->sum('total_days');

            $balances[] = [
                'category_id' => $category->id,
                'category_name' => $category->title,
                'allocated' => $category->default_days_per_year ?? 0,
                'used' => $used,
                'remaining' => ($category->default_days_per_year ?? 0) - $used,
            ];
        }

        return $balances;
    }

    /**
     * Get leave statistics.
     */
    public function getStatistics(?int $staffMemberId = null): array
    {
        $query = TimeOffRequest::query();

        if ($staffMemberId) {
            $query->where('staff_member_id', $staffMemberId);
        }

        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'cancelled' => (clone $query)->where('status', 'cancelled')->count(),
        ];
    }

    /**
     * Get employees on leave for a specific date.
     */
    public function getOnLeave(string $date = null): Collection
    {
        $date = $date ?? now()->toDateString();

        return TimeOffRequest::with('staffMember', 'category')
            ->where('status', 'approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->get();
    }

    /**
     * Check if employee has pending request for date range.
     */
    public function hasOverlappingRequest(int $staffMemberId, string $startDate, string $endDate, ?int $excludeId = null): bool
    {
        $query = TimeOffRequest::where('staff_member_id', $staffMemberId)
            ->whereIn('status', ['pending', 'approved'])
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate])
                  ->orWhere(function ($q) use ($startDate, $endDate) {
                      $q->where('start_date', '<=', $startDate)
                        ->where('end_date', '>=', $endDate);
                  });
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Deduct leave balance (for approved requests).
     */
    protected function deductLeaveBalance(TimeOffRequest $request): void
    {
        // This can be extended to track balances in a separate table
        // For now, balance is calculated dynamically
    }

    /**
     * Restore leave balance (for cancelled approved requests).
     */
    protected function restoreLeaveBalance(TimeOffRequest $request): void
    {
        // This can be extended to track balances in a separate table
    }

    // ========================================
    // LEAVE CATEGORIES
    // ========================================

    /**
     * Get all leave categories.
     */
    public function getAllCategories(array $params = [])
    {
        $query = TimeOffCategory::query();

        if (!empty($params['active_only'])) {
            $query->where('is_active', true);
        }

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? 15;

        return $paginate 
            ? $query->latest()->paginate($perPage) 
            : $query->latest()->get();
    }

    /**
     * Create leave category.
     */
    public function createCategory(array $data): TimeOffCategory
    {
        return TimeOffCategory::create($data);
    }

    /**
     * Update leave category.
     */
    public function updateCategory(int $id, array $data): TimeOffCategory
    {
        $category = TimeOffCategory::findOrFail($id);
        $category->update($data);
        return $category->fresh();
    }

    /**
     * Delete leave category.
     */
    public function deleteCategory(int $id): bool
    {
        return TimeOffCategory::findOrFail($id)->delete();
    }

    /**
     * Get categories for dropdown.
     */
    public function getCategoriesForDropdown(): Collection
    {
        return TimeOffCategory::where('is_active', true)
            ->select('id', 'title')
            ->orderBy('title')
            ->get();
    }
}
