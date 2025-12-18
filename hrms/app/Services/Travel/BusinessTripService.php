<?php

namespace App\Services\Travel;
use App\Services\Core\BaseService;

use App\Models\BusinessTrip;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Business Trip Service
 *
 * Handles all business logic for business trip management.
 */
class BusinessTripService extends BaseService
{
    protected string $modelClass = BusinessTrip::class;

    protected array $defaultRelations = [
        'staffMember',
        'approvedBy',
    ];

    protected array $searchableFields = [
        'destination',
        'purpose',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all business trips with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('departure_date', [$params['start_date'], $params['end_date']]);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a business trip.
     */
    public function create(array $data): BusinessTrip
    {
        $data['status'] = $data['status'] ?? 'pending';
        $trip = BusinessTrip::create($data);

        return $trip->load($this->defaultRelations);
    }

    /**
     * Update a business trip.
     */
    public function update(int|BusinessTrip $trip, array $data): BusinessTrip
    {
        if (is_int($trip)) {
            $trip = $this->findOrFail($trip);
        }

        $trip->update($data);

        return $trip->fresh($this->defaultRelations);
    }

    /**
     * Delete a business trip.
     */
    public function delete(int|BusinessTrip $trip): bool
    {
        if (is_int($trip)) {
            $trip = $this->findOrFail($trip);
        }

        return $trip->delete();
    }

    /**
     * Approve a business trip.
     */
    public function approve(int|BusinessTrip $trip, int $approvedById): BusinessTrip
    {
        if (is_int($trip)) {
            $trip = $this->findOrFail($trip);
        }

        $trip->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $trip->fresh($this->defaultRelations);
    }

    /**
     * Reject a business trip.
     */
    public function reject(int|BusinessTrip $trip, ?string $reason = null): BusinessTrip
    {
        if (is_int($trip)) {
            $trip = $this->findOrFail($trip);
        }

        $trip->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $trip->fresh($this->defaultRelations);
    }

    /**
     * Get trips by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('departure_date', 'desc')
            ->get();
    }

    /**
     * Get upcoming trips.
     */
    public function getUpcoming(): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('departure_date', '>=', now())
            ->where('status', 'approved')
            ->orderBy('departure_date')
            ->get();
    }
}
