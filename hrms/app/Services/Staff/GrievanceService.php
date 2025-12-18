<?php

namespace App\Services\Staff;
use App\Services\Core\BaseService;

use App\Models\Grievance;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Grievance Service
 *
 * Handles all business logic for employee grievance management.
 */
class GrievanceService extends BaseService
{
    protected string $modelClass = Grievance::class;

    protected array $defaultRelations = [
        'staffMember',
        'assignedTo',
    ];

    protected array $searchableFields = [
        'title',
        'description',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
        'priority' => 'priority',
    ];

    /**
     * Get all grievances with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

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
     * Create a new grievance.
     */
    public function create(array $data): Grievance
    {
        $data['status'] = $data['status'] ?? 'open';
        $grievance = Grievance::create($data);

        return $grievance->load($this->defaultRelations);
    }

    /**
     * Update a grievance.
     */
    public function update(int|Grievance $grievance, array $data): Grievance
    {
        if (is_int($grievance)) {
            $grievance = $this->findOrFail($grievance);
        }

        $grievance->update($data);

        return $grievance->fresh($this->defaultRelations);
    }

    /**
     * Delete a grievance.
     */
    public function delete(int|Grievance $grievance): bool
    {
        if (is_int($grievance)) {
            $grievance = $this->findOrFail($grievance);
        }

        return $grievance->delete();
    }

    /**
     * Assign grievance to handler.
     */
    public function assign(int|Grievance $grievance, int $assignedToId): Grievance
    {
        if (is_int($grievance)) {
            $grievance = $this->findOrFail($grievance);
        }

        $grievance->update([
            'assigned_to' => $assignedToId,
            'status' => 'in_progress',
        ]);

        return $grievance->fresh($this->defaultRelations);
    }

    /**
     * Resolve a grievance.
     */
    public function resolve(int|Grievance $grievance, ?string $resolution = null): Grievance
    {
        if (is_int($grievance)) {
            $grievance = $this->findOrFail($grievance);
        }

        $grievance->update([
            'status' => 'resolved',
            'resolution' => $resolution,
            'resolved_at' => now(),
        ]);

        return $grievance->fresh($this->defaultRelations);
    }

    /**
     * Close a grievance.
     */
    public function close(int|Grievance $grievance): Grievance
    {
        if (is_int($grievance)) {
            $grievance = $this->findOrFail($grievance);
        }

        $grievance->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        return $grievance->fresh($this->defaultRelations);
    }

    /**
     * Get grievances by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get open grievances.
     */
    public function getOpen(): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->whereIn('status', ['open', 'in_progress'])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at')
            ->get();
    }
}
