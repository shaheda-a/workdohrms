<?php

namespace App\Services\Staff;
use App\Services\Core\BaseService;

use App\Models\LocationTransfer;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Location Transfer Service
 *
 * Handles all business logic for employee location transfer management.
 */
class LocationTransferService extends BaseService
{
    protected string $modelClass = LocationTransfer::class;

    protected array $defaultRelations = [
        'staffMember',
        'fromLocation',
        'toLocation',
        'approvedBy',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all location transfers with filtering and pagination.
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
     * Create a location transfer.
     */
    public function create(array $data): LocationTransfer
    {
        $data['status'] = $data['status'] ?? 'pending';
        $transfer = LocationTransfer::create($data);

        return $transfer->load($this->defaultRelations);
    }

    /**
     * Update a location transfer.
     */
    public function update(int|LocationTransfer $transfer, array $data): LocationTransfer
    {
        if (is_int($transfer)) {
            $transfer = $this->findOrFail($transfer);
        }

        $transfer->update($data);

        return $transfer->fresh($this->defaultRelations);
    }

    /**
     * Delete a location transfer.
     */
    public function delete(int|LocationTransfer $transfer): bool
    {
        if (is_int($transfer)) {
            $transfer = $this->findOrFail($transfer);
        }

        return $transfer->delete();
    }

    /**
     * Approve a location transfer.
     */
    public function approve(int|LocationTransfer $transfer, int $approvedById): LocationTransfer
    {
        if (is_int($transfer)) {
            $transfer = $this->findOrFail($transfer);
        }

        $transfer->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $transfer->fresh($this->defaultRelations);
    }

    /**
     * Reject a location transfer.
     */
    public function reject(int|LocationTransfer $transfer, ?string $reason = null): LocationTransfer
    {
        if (is_int($transfer)) {
            $transfer = $this->findOrFail($transfer);
        }

        $transfer->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $transfer->fresh($this->defaultRelations);
    }

    /**
     * Complete a location transfer.
     */
    public function complete(int|LocationTransfer $transfer): LocationTransfer
    {
        if (is_int($transfer)) {
            $transfer = $this->findOrFail($transfer);
        }

        $transfer->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $transfer->staffMember->update([
            'office_location_id' => $transfer->to_location_id,
        ]);

        return $transfer->fresh($this->defaultRelations);
    }

    /**
     * Get transfers by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
