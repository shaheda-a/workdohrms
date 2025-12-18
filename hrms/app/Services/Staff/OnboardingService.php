<?php

namespace App\Services\Staff;
use App\Services\Core\BaseService;

use App\Models\OnboardingChecklist;
use App\Models\OnboardingProgress;
use App\Models\OnboardingTask;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Onboarding Service
 *
 * Handles all business logic for employee onboarding management.
 */
class OnboardingService extends BaseService
{
    protected string $modelClass = OnboardingChecklist::class;

    protected array $defaultRelations = [
        'tasks',
    ];

    protected array $searchableFields = [
        'name',
        'description',
    ];

    /**
     * Get all onboarding checklists.
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
     * Create an onboarding checklist.
     */
    public function createChecklist(array $data): OnboardingChecklist
    {
        return DB::transaction(function () use ($data) {
            $checklist = OnboardingChecklist::create($data);

            if (! empty($data['tasks'])) {
                foreach ($data['tasks'] as $order => $task) {
                    OnboardingTask::create([
                        'onboarding_checklist_id' => $checklist->id,
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
     * Update an onboarding checklist.
     */
    public function updateChecklist(int $id, array $data): OnboardingChecklist
    {
        $checklist = OnboardingChecklist::findOrFail($id);
        $checklist->update($data);

        return $checklist->fresh($this->defaultRelations);
    }

    /**
     * Delete an onboarding checklist.
     */
    public function deleteChecklist(int $id): bool
    {
        return OnboardingChecklist::findOrFail($id)->delete();
    }

    // ========================================
    // ONBOARDING TASKS
    // ========================================

    /**
     * Add task to checklist.
     */
    public function addTask(int $checklistId, array $data): OnboardingTask
    {
        $maxOrder = OnboardingTask::where('onboarding_checklist_id', $checklistId)->max('order') ?? 0;

        return OnboardingTask::create([
            'onboarding_checklist_id' => $checklistId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'order' => $data['order'] ?? ($maxOrder + 1),
            'is_required' => $data['is_required'] ?? true,
        ]);
    }

    /**
     * Update a task.
     */
    public function updateTask(int $taskId, array $data): OnboardingTask
    {
        $task = OnboardingTask::findOrFail($taskId);
        $task->update($data);

        return $task->fresh();
    }

    /**
     * Delete a task.
     */
    public function deleteTask(int $taskId): bool
    {
        return OnboardingTask::findOrFail($taskId)->delete();
    }

    /**
     * Reorder tasks.
     */
    public function reorderTasks(int $checklistId, array $taskIds): bool
    {
        return DB::transaction(function () use ($checklistId, $taskIds) {
            foreach ($taskIds as $order => $taskId) {
                OnboardingTask::where('id', $taskId)
                    ->where('onboarding_checklist_id', $checklistId)
                    ->update(['order' => $order + 1]);
            }

            return true;
        });
    }

    // ========================================
    // EMPLOYEE ONBOARDING PROGRESS
    // ========================================

    /**
     * Start onboarding for employee.
     */
    public function startOnboarding(int $staffMemberId, int $checklistId): Collection
    {
        $checklist = OnboardingChecklist::with('tasks')->findOrFail($checklistId);

        return DB::transaction(function () use ($staffMemberId, $checklist) {
            $progress = collect();
            foreach ($checklist->tasks as $task) {
                $item = OnboardingProgress::create([
                    'staff_member_id' => $staffMemberId,
                    'onboarding_task_id' => $task->id,
                    'status' => 'pending',
                ]);
                $progress->push($item);
            }

            return $progress;
        });
    }

    /**
     * Get employee onboarding progress.
     */
    public function getEmployeeProgress(int $staffMemberId): Collection
    {
        return OnboardingProgress::with(['task.checklist'])
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('onboarding_task_id')
            ->get();
    }

    /**
     * Mark task as complete.
     */
    public function completeTask(int $staffMemberId, int $taskId): OnboardingProgress
    {
        $progress = OnboardingProgress::where('staff_member_id', $staffMemberId)
            ->where('onboarding_task_id', $taskId)
            ->firstOrFail();

        $progress->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return $progress->fresh(['task']);
    }

    /**
     * Get onboarding completion percentage.
     */
    public function getCompletionPercentage(int $staffMemberId): float
    {
        $total = OnboardingProgress::where('staff_member_id', $staffMemberId)->count();
        if ($total === 0) {
            return 0;
        }

        $completed = OnboardingProgress::where('staff_member_id', $staffMemberId)
            ->where('status', 'completed')
            ->count();

        return round(($completed / $total) * 100, 2);
    }
}
