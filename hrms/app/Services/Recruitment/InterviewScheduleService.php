<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\InterviewSchedule;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Interview Schedule Service
 *
 * Handles all business logic for interview scheduling.
 */
class InterviewScheduleService extends BaseService
{
    protected string $modelClass = InterviewSchedule::class;

    protected array $defaultRelations = [
        'jobApplication',
        'jobApplication.candidate',
        'jobApplication.job',
        'interviewer',
    ];

    protected array $filterableFields = [
        'job_application_id' => 'job_application_id',
        'interviewer_id' => 'interviewer_id',
        'status' => 'status',
    ];

    /**
     * Get all interviews with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['date'])) {
            $query->whereDate('scheduled_at', $params['date']);
        }

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('scheduled_at', [$params['start_date'], $params['end_date']]);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new interview schedule.
     */
    public function create(array $data): InterviewSchedule
    {
        return DB::transaction(function () use ($data) {
            $data['status'] = $data['status'] ?? 'scheduled';
            $interview = InterviewSchedule::create($data);

            return $interview->load($this->defaultRelations);
        });
    }

    /**
     * Update an interview schedule.
     */
    public function update(int|InterviewSchedule $interview, array $data): InterviewSchedule
    {
        if (is_int($interview)) {
            $interview = $this->findOrFail($interview);
        }

        return DB::transaction(function () use ($interview, $data) {
            $interview->update($data);

            return $interview->fresh($this->defaultRelations);
        });
    }

    /**
     * Delete an interview schedule.
     */
    public function delete(int|InterviewSchedule $interview): bool
    {
        if (is_int($interview)) {
            $interview = $this->findOrFail($interview);
        }

        return $interview->delete();
    }

    /**
     * Submit feedback for an interview.
     */
    public function submitFeedback(int|InterviewSchedule $interview, array $feedbackData): InterviewSchedule
    {
        if (is_int($interview)) {
            $interview = $this->findOrFail($interview);
        }

        $interview->update([
            'feedback' => $feedbackData['feedback'] ?? null,
            'rating' => $feedbackData['rating'] ?? null,
            'recommendation' => $feedbackData['recommendation'] ?? null,
            'status' => 'completed',
        ]);

        return $interview->fresh($this->defaultRelations);
    }

    /**
     * Get today's interviews.
     */
    public function getTodaysInterviews(): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->whereDate('scheduled_at', today())
            ->orderBy('scheduled_at')
            ->get();
    }

    /**
     * Get upcoming interviews.
     */
    public function getUpcoming(int $days = 7): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('scheduled_at', '>=', now())
            ->where('scheduled_at', '<=', now()->addDays($days))
            ->where('status', 'scheduled')
            ->orderBy('scheduled_at')
            ->get();
    }

    /**
     * Cancel an interview.
     */
    public function cancel(int|InterviewSchedule $interview, ?string $reason = null): InterviewSchedule
    {
        if (is_int($interview)) {
            $interview = $this->findOrFail($interview);
        }

        $interview->update([
            'status' => 'cancelled',
            'notes' => $reason ?? $interview->notes,
        ]);

        return $interview->fresh($this->defaultRelations);
    }
}
