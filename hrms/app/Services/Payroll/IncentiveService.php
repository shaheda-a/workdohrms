<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\IncentiveRecord;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Incentive Service
 *
 * Handles all business logic for employee incentive management.
 */
class IncentiveService extends BaseService
{
    protected string $modelClass = IncentiveRecord::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'incentive_type' => 'incentive_type',
    ];

    /**
     * Get all incentive records with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['month']) && ! empty($params['year'])) {
            $query->whereMonth('incentive_date', $params['month'])
                ->whereYear('incentive_date', $params['year']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an incentive record.
     */
    public function create(array $data): IncentiveRecord
    {
        $record = IncentiveRecord::create($data);

        return $record->load($this->defaultRelations);
    }

    /**
     * Update an incentive record.
     */
    public function update(int|IncentiveRecord $record, array $data): IncentiveRecord
    {
        if (is_int($record)) {
            $record = $this->findOrFail($record);
        }

        $record->update($data);

        return $record->fresh($this->defaultRelations);
    }

    /**
     * Delete an incentive record.
     */
    public function delete(int|IncentiveRecord $record): bool
    {
        if (is_int($record)) {
            $record = $this->findOrFail($record);
        }

        return $record->delete();
    }

    /**
     * Get incentives by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('incentive_date', 'desc')
            ->get();
    }

    /**
     * Get total incentives for employee in date range.
     */
    public function getTotalAmount(int $staffMemberId, string $startDate, string $endDate): float
    {
        return $this->query()
            ->where('staff_member_id', $staffMemberId)
            ->whereBetween('incentive_date', [$startDate, $endDate])
            ->sum('amount');
    }
}
