<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\AssessmentQuestion;
use App\Models\AssessmentResponse;
use App\Models\CandidateAssessment;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Candidate Assessment Service
 *
 * Handles all business logic for candidate assessment management.
 */
class CandidateAssessmentService extends BaseService
{
    protected string $modelClass = CandidateAssessment::class;

    protected array $defaultRelations = [
        'candidate',
        'job',
        'questions',
    ];

    protected array $filterableFields = [
        'candidate_id' => 'candidate_id',
        'job_id' => 'job_id',
        'status' => 'status',
    ];

    /**
     * Get all assessments with filtering and pagination.
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
     * Create an assessment.
     */
    public function create(array $data): CandidateAssessment
    {
        return DB::transaction(function () use ($data) {
            $data['status'] = $data['status'] ?? 'pending';
            $assessment = CandidateAssessment::create($data);

            if (! empty($data['questions'])) {
                foreach ($data['questions'] as $order => $question) {
                    AssessmentQuestion::create([
                        'candidate_assessment_id' => $assessment->id,
                        'question' => $question['question'],
                        'question_type' => $question['question_type'] ?? 'text',
                        'options' => $question['options'] ?? null,
                        'correct_answer' => $question['correct_answer'] ?? null,
                        'points' => $question['points'] ?? 1,
                        'order' => $order + 1,
                    ]);
                }
            }

            return $assessment->load($this->defaultRelations);
        });
    }

    /**
     * Update an assessment.
     */
    public function update(int|CandidateAssessment $assessment, array $data): CandidateAssessment
    {
        if (is_int($assessment)) {
            $assessment = $this->findOrFail($assessment);
        }

        $assessment->update($data);

        return $assessment->fresh($this->defaultRelations);
    }

    /**
     * Delete an assessment.
     */
    public function delete(int|CandidateAssessment $assessment): bool
    {
        if (is_int($assessment)) {
            $assessment = $this->findOrFail($assessment);
        }

        return $assessment->delete();
    }

    /**
     * Send assessment to candidate.
     */
    public function send(int|CandidateAssessment $assessment): CandidateAssessment
    {
        if (is_int($assessment)) {
            $assessment = $this->findOrFail($assessment);
        }

        $assessment->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        return $assessment->fresh($this->defaultRelations);
    }

    /**
     * Submit assessment responses.
     */
    public function submitResponses(int $assessmentId, array $responses): CandidateAssessment
    {
        $assessment = $this->findOrFail($assessmentId);

        return DB::transaction(function () use ($assessment, $responses) {
            $totalScore = 0;
            $maxScore = 0;

            foreach ($responses as $response) {
                $question = AssessmentQuestion::findOrFail($response['question_id']);
                $maxScore += $question->points;

                $isCorrect = false;
                if ($question->correct_answer && $response['answer'] === $question->correct_answer) {
                    $isCorrect = true;
                    $totalScore += $question->points;
                }

                AssessmentResponse::create([
                    'candidate_assessment_id' => $assessment->id,
                    'assessment_question_id' => $response['question_id'],
                    'answer' => $response['answer'],
                    'is_correct' => $isCorrect,
                    'score' => $isCorrect ? $question->points : 0,
                ]);
            }

            $assessment->update([
                'status' => 'completed',
                'completed_at' => now(),
                'score' => $totalScore,
                'max_score' => $maxScore,
            ]);

            return $assessment->fresh($this->defaultRelations);
        });
    }

    /**
     * Get assessments by candidate.
     */
    public function getByCandidate(int $candidateId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('candidate_id', $candidateId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get assessments by job.
     */
    public function getByJob(int $jobId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('job_id', $jobId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
