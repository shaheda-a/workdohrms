<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\CustomQuestion;
use App\Models\Job;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Job Service
 *
 * Handles all business logic for job posting management.
 */
class JobService extends BaseService
{
    protected string $modelClass = Job::class;

    protected array $defaultRelations = [
        'category',
        'officeLocation',
        'division',
    ];

    protected array $searchableFields = [
        'title',
    ];

    protected array $filterableFields = [
        'status' => 'status',
        'job_category_id' => 'job_category_id',
        'office_location_id' => 'office_location_id',
    ];

    /**
     * Get all jobs with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()
            ->with($this->defaultRelations)
            ->withCount('applications');

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
     * Create a new job posting.
     */
    public function create(array $data): Job
    {
        return DB::transaction(function () use ($data) {
            $job = Job::create($data);

            return $job->load($this->defaultRelations);
        });
    }

    /**
     * Get job with full details.
     */
    public function getWithDetails(int $id): Job
    {
        return $this->query()
            ->with([
                'category',
                'officeLocation',
                'division',
                'applications.candidate',
                'customQuestions',
            ])
            ->findOrFail($id);
    }

    /**
     * Update a job posting.
     */
    public function update(int|Job $job, array $data): Job
    {
        if (is_int($job)) {
            $job = $this->findOrFail($job);
        }

        return DB::transaction(function () use ($job, $data) {
            $job->update($data);

            return $job->fresh($this->defaultRelations);
        });
    }

    /**
     * Delete a job posting.
     */
    public function delete(int|Job $job): bool
    {
        if (is_int($job)) {
            $job = $this->findOrFail($job);
        }

        return $job->delete();
    }

    /**
     * Publish a job posting.
     */
    public function publish(int|Job $job): Job
    {
        if (is_int($job)) {
            $job = $this->findOrFail($job);
        }

        $job->update(['status' => 'open']);

        return $job->fresh();
    }

    /**
     * Close a job posting.
     */
    public function close(int|Job $job): Job
    {
        if (is_int($job)) {
            $job = $this->findOrFail($job);
        }

        $job->update(['status' => 'closed']);

        return $job->fresh();
    }

    /**
     * Get custom questions for a job.
     */
    public function getQuestions(int|Job $job): Collection
    {
        if (is_int($job)) {
            $job = $this->findOrFail($job);
        }

        return $job->customQuestions()->orderBy('order')->get();
    }

    /**
     * Add a custom question to a job.
     */
    public function addQuestion(int|Job $job, array $data): CustomQuestion
    {
        if (is_int($job)) {
            $job = $this->findOrFail($job);
        }

        $maxOrder = $job->customQuestions()->max('order') ?? 0;

        return CustomQuestion::create([
            'job_posting_id' => $job->id,
            'question' => $data['question'],
            'is_required' => $data['is_required'] ?? false,
            'order' => $maxOrder + 1,
        ]);
    }

    /**
     * Get open jobs for dropdown.
     */
    public function getOpenJobs(): Collection
    {
        return $this->query()
            ->where('status', 'open')
            ->select(['id', 'title'])
            ->orderBy('title')
            ->get();
    }
}
