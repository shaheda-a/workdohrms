<?php

namespace App\Services\Training;
use App\Services\Core\BaseService;

use App\Models\TrainingProgram;
use App\Models\TrainingSession;
use App\Models\TrainingType;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Training Service
 *
 * Handles all business logic for training programs and sessions.
 */
class TrainingService extends BaseService
{
    protected string $modelClass = TrainingProgram::class;

    protected array $defaultRelations = [
        'trainingType',
        'sessions',
    ];

    protected array $searchableFields = [
        'title',
        'description',
    ];

    protected array $filterableFields = [
        'training_type_id' => 'training_type_id',
        'status' => 'status',
    ];

    // ========================================
    // TRAINING PROGRAMS
    // ========================================

    /**
     * Get all training programs.
     */
    public function getAllPrograms(array $params = [])
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create training program.
     */
    public function createProgram(array $data, ?int $authorId = null): TrainingProgram
    {
        if ($authorId) {
            $data['author_id'] = $authorId;
        }

        return TrainingProgram::create($data);
    }

    /**
     * Update training program.
     */
    public function updateProgram(int $id, array $data): TrainingProgram
    {
        $program = TrainingProgram::findOrFail($id);
        $program->update($data);

        return $program->fresh($this->defaultRelations);
    }

    /**
     * Delete training program.
     */
    public function deleteProgram(int $id): bool
    {
        return TrainingProgram::findOrFail($id)->delete();
    }

    /**
     * Get program statistics.
     */
    public function getProgramStatistics(): array
    {
        return [
            'total_programs' => TrainingProgram::count(),
            'active_programs' => TrainingProgram::where('status', 'active')->count(),
            'completed_programs' => TrainingProgram::where('status', 'completed')->count(),
            'total_sessions' => TrainingSession::count(),
        ];
    }

    // ========================================
    // TRAINING SESSIONS
    // ========================================

    /**
     * Get all training sessions.
     */
    public function getAllSessions(array $params = [])
    {
        $query = TrainingSession::with(['trainingProgram', 'trainer', 'participants']);

        if (! empty($params['training_program_id'])) {
            $query->where('training_program_id', $params['training_program_id']);
        }

        if (! empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        if (! empty($params['upcoming'])) {
            $query->where('start_datetime', '>=', now());
        }

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->latest()->paginate($perPage)
            : $query->latest()->get();
    }

    /**
     * Create training session.
     */
    public function createSession(array $data): TrainingSession
    {
        return DB::transaction(function () use ($data) {
            $session = TrainingSession::create($data);

            if (! empty($data['participant_ids'])) {
                $session->participants()->attach($data['participant_ids']);
            }

            return $session->load(['trainingProgram', 'participants']);
        });
    }

    /**
     * Update training session.
     */
    public function updateSession(int $id, array $data): TrainingSession
    {
        return DB::transaction(function () use ($id, $data) {
            $session = TrainingSession::findOrFail($id);
            $session->update($data);

            if (isset($data['participant_ids'])) {
                $session->participants()->sync($data['participant_ids']);
            }

            return $session->fresh(['trainingProgram', 'participants']);
        });
    }

    /**
     * Delete training session.
     */
    public function deleteSession(int $id): bool
    {
        return TrainingSession::findOrFail($id)->delete();
    }

    /**
     * Add participant to session.
     */
    public function addParticipant(int $sessionId, int $staffMemberId, array $data = []): void
    {
        $session = TrainingSession::findOrFail($sessionId);
        $session->participants()->attach($staffMemberId, $data);
    }

    /**
     * Remove participant from session.
     */
    public function removeParticipant(int $sessionId, int $staffMemberId): void
    {
        $session = TrainingSession::findOrFail($sessionId);
        $session->participants()->detach($staffMemberId);
    }

    /**
     * Mark session as completed.
     */
    public function completeSession(int $sessionId): TrainingSession
    {
        $session = TrainingSession::findOrFail($sessionId);
        $session->update(['status' => 'completed']);

        return $session->fresh();
    }

    // ========================================
    // TRAINING TYPES
    // ========================================

    /**
     * Get all training types.
     */
    public function getAllTypes(): Collection
    {
        return TrainingType::orderBy('title')->get();
    }

    /**
     * Create training type.
     */
    public function createType(array $data): TrainingType
    {
        return TrainingType::create($data);
    }

    /**
     * Update training type.
     */
    public function updateType(int $id, array $data): TrainingType
    {
        $type = TrainingType::findOrFail($id);
        $type->update($data);

        return $type->fresh();
    }

    /**
     * Delete training type.
     */
    public function deleteType(int $id): bool
    {
        return TrainingType::findOrFail($id)->delete();
    }
}
