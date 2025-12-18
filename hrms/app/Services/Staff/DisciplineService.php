<?php

namespace App\Services\Staff;
use App\Services\Core\BaseService;

use App\Models\DisciplineNote;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Discipline Service
 *
 * Handles all business logic for employee discipline note management.
 */
class DisciplineService extends BaseService
{
    protected string $modelClass = DisciplineNote::class;

    protected array $defaultRelations = [
        'staffMember',
        'issuedBy',
    ];

    protected array $searchableFields = [
        'title',
        'description',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'type' => 'type',
    ];

    /**
     * Get all discipline notes with filtering and pagination.
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
     * Create a discipline note.
     */
    public function create(array $data, ?int $issuedById = null): DisciplineNote
    {
        $data['issued_by'] = $issuedById ?? $data['issued_by'] ?? null;
        $note = DisciplineNote::create($data);

        return $note->load($this->defaultRelations);
    }

    /**
     * Update a discipline note.
     */
    public function update(int|DisciplineNote $note, array $data): DisciplineNote
    {
        if (is_int($note)) {
            $note = $this->findOrFail($note);
        }

        $note->update($data);

        return $note->fresh($this->defaultRelations);
    }

    /**
     * Delete a discipline note.
     */
    public function delete(int|DisciplineNote $note): bool
    {
        if (is_int($note)) {
            $note = $this->findOrFail($note);
        }

        return $note->delete();
    }

    /**
     * Get discipline notes by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
