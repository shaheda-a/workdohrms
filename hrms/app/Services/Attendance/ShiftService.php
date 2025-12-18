<?php

namespace App\Services\Attendance;
use App\Services\Core\BaseService;

use App\Models\Shift;
use App\Models\ShiftAssignment;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Shift Service
 *
 * Handles all business logic for shift management.
 */
class ShiftService extends BaseService
{
    protected string $modelClass = Shift::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'name',
    ];

    /**
     * Get all shifts.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query();

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new shift.
     */
    public function create(array $data): Shift
    {
        return Shift::create($data);
    }

    /**
     * Update a shift.
     */
    public function update(int|Shift $shift, array $data): Shift
    {
        if (is_int($shift)) {
            $shift = $this->findOrFail($shift);
        }

        $shift->update($data);

        return $shift->fresh();
    }

    /**
     * Delete a shift.
     */
    public function delete(int|Shift $shift): bool
    {
        if (is_int($shift)) {
            $shift = $this->findOrFail($shift);
        }

        return $shift->delete();
    }

    /**
     * Assign shift to employees.
     */
    public function assignToEmployees(int|Shift $shift, array $employeeIds, array $data = []): Collection
    {
        if (is_int($shift)) {
            $shift = $this->findOrFail($shift);
        }

        return DB::transaction(function () use ($shift, $employeeIds, $data) {
            $assignments = collect();
            foreach ($employeeIds as $employeeId) {
                $assignment = ShiftAssignment::updateOrCreate(
                    [
                        'shift_id' => $shift->id,
                        'staff_member_id' => $employeeId,
                    ],
                    [
                        'effective_from' => $data['effective_from'] ?? now(),
                        'effective_to' => $data['effective_to'] ?? null,
                    ]
                );
                $assignments->push($assignment);
            }

            return $assignments;
        });
    }

    /**
     * Get shifts for dropdown.
     */
    public function getForDropdown(): Collection
    {
        return $this->query()
            ->select(['id', 'name', 'start_time', 'end_time'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Get employee's current shift.
     */
    public function getEmployeeShift(int $staffMemberId): ?Shift
    {
        $assignment = ShiftAssignment::where('staff_member_id', $staffMemberId)
            ->where('effective_from', '<=', now())
            ->where(function ($q) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', now());
            })
            ->first();

        return $assignment ? $assignment->shift : null;
    }
}
