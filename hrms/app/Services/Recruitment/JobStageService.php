<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\JobStage;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Job Stage Service
 *
 * Handles all business logic for job stage/pipeline management.
 */
class JobStageService extends BaseService
{
    protected string $modelClass = JobStage::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'name',
    ];

    /**
     * Get all job stages.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->orderBy('order');

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new job stage.
     */
    public function create(array $data): JobStage
    {
        $maxOrder = JobStage::max('order') ?? 0;
        $data['order'] = $data['order'] ?? ($maxOrder + 1);

        return JobStage::create($data);
    }

    /**
     * Update a job stage.
     */
    public function update(int|JobStage $stage, array $data): JobStage
    {
        if (is_int($stage)) {
            $stage = $this->findOrFail($stage);
        }

        $stage->update($data);

        return $stage->fresh();
    }

    /**
     * Delete a job stage.
     */
    public function delete(int|JobStage $stage): bool
    {
        if (is_int($stage)) {
            $stage = $this->findOrFail($stage);
        }

        return $stage->delete();
    }

    /**
     * Reorder stages.
     */
    public function reorder(array $stageIds): bool
    {
        return DB::transaction(function () use ($stageIds) {
            foreach ($stageIds as $order => $stageId) {
                JobStage::where('id', $stageId)->update(['order' => $order + 1]);
            }

            return true;
        });
    }

    /**
     * Get stages for dropdown.
     */
    public function getForDropdown(): Collection
    {
        return $this->query()
            ->select(['id', 'name'])
            ->orderBy('order')
            ->get();
    }
}
