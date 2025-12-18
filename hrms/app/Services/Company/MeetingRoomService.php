<?php

namespace App\Services\Company;
use App\Services\Core\BaseService;

use App\Models\MeetingRoom;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Meeting Room Service
 *
 * Handles all business logic for meeting room management.
 */
class MeetingRoomService extends BaseService
{
    protected string $modelClass = MeetingRoom::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'name',
        'location',
    ];

    /**
     * Get all meeting rooms.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query();

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
     * Create a new meeting room.
     */
    public function create(array $data): MeetingRoom
    {
        return MeetingRoom::create($data);
    }

    /**
     * Update a meeting room.
     */
    public function update(int|MeetingRoom $room, array $data): MeetingRoom
    {
        if (is_int($room)) {
            $room = $this->findOrFail($room);
        }

        $room->update($data);

        return $room->fresh();
    }

    /**
     * Delete a meeting room.
     */
    public function delete(int|MeetingRoom $room): bool
    {
        if (is_int($room)) {
            $room = $this->findOrFail($room);
        }

        return $room->delete();
    }

    /**
     * Get available rooms.
     */
    public function getAvailable(): Collection
    {
        return $this->query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get rooms for dropdown.
     */
    public function getForDropdown(): Collection
    {
        return $this->query()
            ->where('is_active', true)
            ->select(['id', 'name', 'capacity'])
            ->orderBy('name')
            ->get();
    }
}
