<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\ApplicationNote;
use App\Models\JobApplication;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Job Application Service
 *
 * Handles all business logic for job application management.
 */
class JobApplicationService extends BaseService
{
    protected string $modelClass = JobApplication::class;

    protected array $defaultRelations = [
        'job',
        'candidate',
        'stage',
    ];

    protected array $searchableFields = [];

    protected array $filterableFields = [
        'job_posting_id' => 'job_id',
        'candidate_id' => 'candidate_id',
        'job_stage_id' => 'stage_id',
        'status' => 'status',
    ];

    /**
     * Get all applications with filtering and pagination.
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
     * Get application with full details.
     */
    public function getWithDetails(int $id): JobApplication
    {
        return $this->query()
            ->with([
                'job',
                'candidate',
                'stage',
                'interviews',
                'applicationNotes',
            ])
            ->findOrFail($id);
    }

    /**
     * Create a new application.
     */
    public function create(array $data): JobApplication
    {
        return DB::transaction(function () use ($data) {
            $data['applied_date'] = $data['applied_date'] ?? now();
            $data['status'] = $data['status'] ?? 'applied';
            $application = JobApplication::create($data);

            return $application->load($this->defaultRelations);
        });
    }

    /**
     * Move application to a different stage.
     */
    public function moveToStage(int|JobApplication $application, int $stageId): JobApplication
    {
        if (is_int($application)) {
            $application = $this->findOrFail($application);
        }

        $application->update(['job_stage_id' => $stageId]);

        return $application->fresh($this->defaultRelations);
    }

    /**
     * Rate an application.
     */
    public function rate(int|JobApplication $application, int $rating): JobApplication
    {
        if (is_int($application)) {
            $application = $this->findOrFail($application);
        }

        $application->update(['rating' => $rating]);

        return $application->fresh($this->defaultRelations);
    }

    /**
     * Shortlist an application.
     */
    public function shortlist(int|JobApplication $application): JobApplication
    {
        if (is_int($application)) {
            $application = $this->findOrFail($application);
        }

        $application->update(['status' => 'shortlisted']);

        return $application->fresh($this->defaultRelations);
    }

    /**
     * Reject an application.
     */
    public function reject(int|JobApplication $application, ?string $reason = null): JobApplication
    {
        if (is_int($application)) {
            $application = $this->findOrFail($application);
        }

        $application->update([
            'status' => 'rejected',
            'notes' => $reason ?? $application->notes,
        ]);

        return $application->fresh($this->defaultRelations);
    }

    /**
     * Hire an applicant.
     */
    public function hire(int|JobApplication $application): JobApplication
    {
        if (is_int($application)) {
            $application = $this->findOrFail($application);
        }

        $application->update(['status' => 'hired']);

        return $application->fresh($this->defaultRelations);
    }

    /**
     * Add a note to an application.
     */
    public function addNote(int|JobApplication $application, string $note, int $authorId): ApplicationNote
    {
        if (is_int($application)) {
            $application = $this->findOrFail($application);
        }

        return ApplicationNote::create([
            'job_application_id' => $application->id,
            'note' => $note,
            'author_id' => $authorId,
        ]);
    }

    /**
     * Get applications by job.
     */
    public function getByJob(int $jobId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('job_posting_id', $jobId)
            ->orderBy('applied_date', 'desc')
            ->get();
    }

    /**
     * Get applications by candidate.
     */
    public function getByCandidate(int $candidateId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('candidate_id', $candidateId)
            ->orderBy('applied_date', 'desc')
            ->get();
    }
}
