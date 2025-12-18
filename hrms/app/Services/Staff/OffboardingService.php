<?php

namespace App\Services\Staff;
use App\Services\Core\BaseService;

use App\Models\OffboardingChecklist;
use App\Models\OffboardingProgress;
use App\Models\OffboardingTask;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Offboarding Service
 *
 * Handles all business logic for employee offboarding/exit management.
 */
class OffboardingService extends BaseService
{
    protected string $modelClass = OffboardingChecklist::class;

    protected array $defaultRelations = [
        'tasks',
    ];

    protected array $searchableFields = [
        'name',
        'description',
    ];

    /**
     * Get all offboarding checklists.
     */
    public function getAllChecklists(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

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
     * Create an offboarding checklist.
     */
    public function createChecklist(array $data): OffboardingChecklist
    {
        return DB::transaction(function () use ($data) {
            $checklist = OffboardingChecklist::create($data);

            if (! empty($data['tasks'])) {
                foreach ($data['tasks'] as $order => $task) {
                    OffboardingTask::create([
                        'offboarding_checklist_id' => $checklist->id,
                        'title' => $task['title'],
                        'description' => $task['description'] ?? null,
                        'order' => $order + 1,
                        'is_required' => $task['is_required'] ?? true,
                    ]);
                }
            }

            return $checklist->load($this->defaultRelations);
        });
    }

    /**
     * Update an offboarding checklist.
     */
    public function updateChecklist(int $id, array $data): OffboardingChecklist
    {
        $checklist = OffboardingChecklist::findOrFail($id);
        $checklist->update($data);

        return $checklist->fresh($this->defaultRelations);
    }

    /**
     * Delete an offboarding checklist.
     */
    public function deleteChecklist(int $id): bool
    {
        return OffboardingChecklist::findOrFail($id)->delete();
    }

    // ========================================
    // OFFBOARDING TASKS
    // ========================================

    /**
     * Add task to checklist.
     */
    public function addTask(int $checklistId, array $data): OffboardingTask
    {
        $maxOrder = OffboardingTask::where('offboarding_checklist_id', $checklistId)->max('order') ?? 0;

        return OffboardingTask::create([
            'offboarding_checklist_id' => $checklistId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'order' => $data['order'] ?? ($maxOrder + 1),
            'is_required' => $data['is_required'] ?? true,
        ]);
    }

    /**
     * Update a task.
     */
    public function updateTask(int $taskId, array $data): OffboardingTask
    {
        $task = OffboardingTask::findOrFail($taskId);
        $task->update($data);

        return $task->fresh();
    }

    /**
     * Delete a task.
     */
    public function deleteTask(int $taskId): bool
    {
        return OffboardingTask::findOrFail($taskId)->delete();
    }

    // ========================================
    // EMPLOYEE OFFBOARDING PROGRESS
    // ========================================

    /**
     * Start offboarding for employee.
     */
    public function startOffboarding(int $staffMemberId, int $checklistId): Collection
    {
        $checklist = OffboardingChecklist::with('tasks')->findOrFail($checklistId);

        return DB::transaction(function () use ($staffMemberId, $checklist) {
            $progress = collect();
            foreach ($checklist->tasks as $task) {
                $item = OffboardingProgress::create([
                    'staff_member_id' => $staffMemberId,
                    'offboarding_task_id' => $task->id,
                    'status' => 'pending',
                ]);
                $progress->push($item);
            }

            return $progress;
        });
    }

    /**
     * Get employee offboarding progress.
     */
    public function getEmployeeProgress(int $staffMemberId): Collection
    {
        return OffboardingProgress::with(['task.checklist'])
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('offboarding_task_id')
            ->get();
    }

    /**
     * Mark task as complete.
     */
    public function completeTask(int $staffMemberId, int $taskId): OffboardingProgress
    {
        $progress = OffboardingProgress::where('staff_member_id', $staffMemberId)
            ->where('offboarding_task_id', $taskId)
            ->firstOrFail();

        $progress->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return $progress->fresh(['task']);
    }

    /**
     * Get offboarding completion percentage.
     */
    public function getCompletionPercentage(int $staffMemberId): float
    {
        $total = OffboardingProgress::where('staff_member_id', $staffMemberId)->count();
        if ($total === 0) {
            return 0;
        }

        $completed = OffboardingProgress::where('staff_member_id', $staffMemberId)
            ->where('status', 'completed')
            ->count();

        return round(($completed / $total) * 100, 2);
    }
}
