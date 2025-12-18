<?php

namespace App\Services\Performance;
use App\Services\Core\BaseService;

use App\Models\AppraisalCycle;
use App\Models\AppraisalRecord;
use App\Models\PerformanceObjective;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Performance Service
 *
 * Handles all business logic for performance management.
 */
class PerformanceService extends BaseService
{
    protected string $modelClass = AppraisalRecord::class;

    protected array $defaultRelations = [
        'staffMember',
        'appraisalCycle',
        'reviewer',
    ];

    /**
     * Get all appraisal records with filtering and pagination.
     */
    public function getAllAppraisals(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        if (! empty($params['staff_member_id'])) {
            $query->where('staff_member_id', $params['staff_member_id']);
        }

        if (! empty($params['appraisal_cycle_id'])) {
            $query->where('appraisal_cycle_id', $params['appraisal_cycle_id']);
        }

        if (! empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an appraisal record.
     */
    public function createAppraisal(array $data): AppraisalRecord
    {
        $data['status'] = $data['status'] ?? 'draft';
        $record = AppraisalRecord::create($data);

        return $record->load($this->defaultRelations);
    }

    /**
     * Update an appraisal record.
     */
    public function updateAppraisal(int $id, array $data): AppraisalRecord
    {
        $record = AppraisalRecord::findOrFail($id);
        $record->update($data);

        return $record->fresh($this->defaultRelations);
    }

    /**
     * Delete an appraisal record.
     */
    public function deleteAppraisal(int $id): bool
    {
        return AppraisalRecord::findOrFail($id)->delete();
    }

    /**
     * Submit an appraisal for review.
     */
    public function submitAppraisal(int $id): AppraisalRecord
    {
        $record = AppraisalRecord::findOrFail($id);
        $record->update(['status' => 'submitted']);

        return $record->fresh($this->defaultRelations);
    }

    /**
     * Complete an appraisal.
     */
    public function completeAppraisal(int $id, array $data): AppraisalRecord
    {
        $record = AppraisalRecord::findOrFail($id);
        $record->update([
            'status' => 'completed',
            'final_rating' => $data['final_rating'] ?? null,
            'reviewer_comments' => $data['reviewer_comments'] ?? null,
            'completed_at' => now(),
        ]);

        return $record->fresh($this->defaultRelations);
    }

    // ========================================
    // APPRAISAL CYCLES
    // ========================================

    /**
     * Get all appraisal cycles.
     */
    public function getAllCycles(array $params = []): LengthAwarePaginator|Collection
    {
        $query = AppraisalCycle::query();

        if (! empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        $query->orderBy('start_date', 'desc');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an appraisal cycle.
     */
    public function createCycle(array $data): AppraisalCycle
    {
        $data['status'] = $data['status'] ?? 'draft';

        return AppraisalCycle::create($data);
    }

    /**
     * Update an appraisal cycle.
     */
    public function updateCycle(int $id, array $data): AppraisalCycle
    {
        $cycle = AppraisalCycle::findOrFail($id);
        $cycle->update($data);

        return $cycle->fresh();
    }

    /**
     * Delete an appraisal cycle.
     */
    public function deleteCycle(int $id): bool
    {
        return AppraisalCycle::findOrFail($id)->delete();
    }

    /**
     * Activate an appraisal cycle.
     */
    public function activateCycle(int $id): AppraisalCycle
    {
        $cycle = AppraisalCycle::findOrFail($id);
        $cycle->update(['status' => 'active']);

        return $cycle->fresh();
    }

    /**
     * Close an appraisal cycle.
     */
    public function closeCycle(int $id): AppraisalCycle
    {
        $cycle = AppraisalCycle::findOrFail($id);
        $cycle->update(['status' => 'closed']);

        return $cycle->fresh();
    }

    // ========================================
    // PERFORMANCE OBJECTIVES
    // ========================================

    /**
     * Get all objectives.
     */
    public function getAllObjectives(array $params = []): LengthAwarePaginator|Collection
    {
        $query = PerformanceObjective::with(['staffMember']);

        if (! empty($params['staff_member_id'])) {
            $query->where('staff_member_id', $params['staff_member_id']);
        }

        if (! empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        $query->orderBy('created_at', 'desc');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an objective.
     */
    public function createObjective(array $data): PerformanceObjective
    {
        $data['status'] = $data['status'] ?? 'active';
        $objective = PerformanceObjective::create($data);

        return $objective->load('staffMember');
    }

    /**
     * Update an objective.
     */
    public function updateObjective(int $id, array $data): PerformanceObjective
    {
        $objective = PerformanceObjective::findOrFail($id);
        $objective->update($data);

        return $objective->fresh('staffMember');
    }

    /**
     * Delete an objective.
     */
    public function deleteObjective(int $id): bool
    {
        return PerformanceObjective::findOrFail($id)->delete();
    }

    /**
     * Update objective progress.
     */
    public function updateObjectiveProgress(int $id, int $progress): PerformanceObjective
    {
        $objective = PerformanceObjective::findOrFail($id);
        $objective->update([
            'progress' => $progress,
            'status' => $progress >= 100 ? 'completed' : 'active',
        ]);

        return $objective->fresh('staffMember');
    }
}
