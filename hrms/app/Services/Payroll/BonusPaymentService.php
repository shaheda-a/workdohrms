<?php

namespace App\Services\Payroll;
use App\Services\Core\BaseService;

use App\Models\BonusPayment;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Bonus Payment Service
 *
 * Handles all business logic for bonus payment management.
 */
class BonusPaymentService extends BaseService
{
    protected string $modelClass = BonusPayment::class;

    protected array $defaultRelations = [
        'staffMember',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
        'bonus_type' => 'bonus_type',
    ];

    /**
     * Get all bonus payments with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['month']) && ! empty($params['year'])) {
            $query->whereMonth('payment_date', $params['month'])
                ->whereYear('payment_date', $params['year']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a bonus payment.
     */
    public function create(array $data): BonusPayment
    {
        $data['status'] = $data['status'] ?? 'pending';
        $bonus = BonusPayment::create($data);

        return $bonus->load($this->defaultRelations);
    }

    /**
     * Update a bonus payment.
     */
    public function update(int|BonusPayment $bonus, array $data): BonusPayment
    {
        if (is_int($bonus)) {
            $bonus = $this->findOrFail($bonus);
        }

        $bonus->update($data);

        return $bonus->fresh($this->defaultRelations);
    }

    /**
     * Delete a bonus payment.
     */
    public function delete(int|BonusPayment $bonus): bool
    {
        if (is_int($bonus)) {
            $bonus = $this->findOrFail($bonus);
        }

        return $bonus->delete();
    }

    /**
     * Approve a bonus payment.
     */
    public function approve(int|BonusPayment $bonus): BonusPayment
    {
        if (is_int($bonus)) {
            $bonus = $this->findOrFail($bonus);
        }

        $bonus->update(['status' => 'approved']);

        return $bonus->fresh($this->defaultRelations);
    }

    /**
     * Mark bonus as paid.
     */
    public function markPaid(int|BonusPayment $bonus): BonusPayment
    {
        if (is_int($bonus)) {
            $bonus = $this->findOrFail($bonus);
        }

        $bonus->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return $bonus->fresh($this->defaultRelations);
    }

    /**
     * Get bonuses by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('payment_date', 'desc')
            ->get();
    }

    /**
     * Bulk create bonuses.
     */
    public function bulkCreate(array $employeeIds, array $bonusData): Collection
    {
        return DB::transaction(function () use ($employeeIds, $bonusData) {
            $bonuses = collect();
            foreach ($employeeIds as $employeeId) {
                $data = array_merge($bonusData, ['staff_member_id' => $employeeId]);
                $bonuses->push($this->create($data));
            }

            return $bonuses;
        });
    }
}
