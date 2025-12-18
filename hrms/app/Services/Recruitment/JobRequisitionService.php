<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\JobRequisition;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Job Requisition Service
 *
 * Handles all business logic for job requisition management.
 */
class JobRequisitionService extends BaseService
{
    protected string $modelClass = JobRequisition::class;

    protected array $defaultRelations = [
        'requestedBy',
        'approvedBy',
        'division',
        'jobTitle',
    ];

    protected array $searchableFields = [
        'title',
        'justification',
    ];

    protected array $filterableFields = [
        'status' => 'status',
        'division_id' => 'division_id',
    ];

    /**
     * Get all requisitions with filtering and pagination.
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
     * Create a new requisition.
     */
    public function create(array $data, ?int $requestedById = null): JobRequisition
    {
        $data['requested_by'] = $requestedById ?? $data['requested_by'] ?? null;
        $data['status'] = $data['status'] ?? 'pending';
        $requisition = JobRequisition::create($data);

        return $requisition->load($this->defaultRelations);
    }

    /**
     * Update a requisition.
     */
    public function update(int|JobRequisition $requisition, array $data): JobRequisition
    {
        if (is_int($requisition)) {
            $requisition = $this->findOrFail($requisition);
        }

        $requisition->update($data);

        return $requisition->fresh($this->defaultRelations);
    }

    /**
     * Delete a requisition.
     */
    public function delete(int|JobRequisition $requisition): bool
    {
        if (is_int($requisition)) {
            $requisition = $this->findOrFail($requisition);
        }

        return $requisition->delete();
    }

    /**
     * Approve a requisition.
     */
    public function approve(int|JobRequisition $requisition, int $approvedById): JobRequisition
    {
        if (is_int($requisition)) {
            $requisition = $this->findOrFail($requisition);
        }

        $requisition->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $requisition->fresh($this->defaultRelations);
    }

    /**
     * Reject a requisition.
     */
    public function reject(int|JobRequisition $requisition, int $rejectedById, ?string $reason = null): JobRequisition
    {
        if (is_int($requisition)) {
            $requisition = $this->findOrFail($requisition);
        }

        $requisition->update([
            'status' => 'rejected',
            'approved_by' => $rejectedById,
            'rejection_reason' => $reason,
        ]);

        return $requisition->fresh($this->defaultRelations);
    }

    /**
     * Get pending requisitions.
     */
    public function getPending(): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Convert requisition to job posting.
     */
    public function convertToJob(int|JobRequisition $requisition): JobRequisition
    {
        if (is_int($requisition)) {
            $requisition = $this->findOrFail($requisition);
        }

        $requisition->update(['status' => 'converted']);

        return $requisition->fresh($this->defaultRelations);
    }
}
