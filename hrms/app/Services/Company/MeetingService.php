<?php

namespace App\Services\Company;
use App\Services\Core\BaseService;

use App\Models\Meeting;
use App\Models\MeetingActionItem;
use App\Models\MeetingAttendee;
use App\Models\MeetingMinutes;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Meeting Service
 *
 * Handles all business logic for meeting management.
 */
class MeetingService extends BaseService
{
    protected string $modelClass = Meeting::class;

    protected array $defaultRelations = [
        'meetingType',
        'meetingRoom',
        'organizer',
        'attendees.staffMember',
    ];

    protected array $searchableFields = [
        'title',
        'description',
    ];

    protected array $filterableFields = [
        'meeting_type_id' => 'meeting_type_id',
        'meeting_room_id' => 'meeting_room_id',
        'status' => 'status',
    ];

    /**
     * Get all meetings with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['date'])) {
            $query->whereDate('start_time', $params['date']);
        }

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('start_time', [$params['start_date'], $params['end_date']]);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new meeting.
     */
    public function create(array $data, ?int $organizerId = null): Meeting
    {
        return DB::transaction(function () use ($data, $organizerId) {
            $data['organizer_id'] = $organizerId ?? $data['organizer_id'] ?? null;
            $data['status'] = $data['status'] ?? 'scheduled';

            $meeting = Meeting::create($data);

            if (! empty($data['attendee_ids'])) {
                foreach ($data['attendee_ids'] as $attendeeId) {
                    MeetingAttendee::create([
                        'meeting_id' => $meeting->id,
                        'staff_member_id' => $attendeeId,
                        'status' => 'pending',
                    ]);
                }
            }

            return $meeting->load($this->defaultRelations);
        });
    }

    /**
     * Update a meeting.
     */
    public function update(int|Meeting $meeting, array $data): Meeting
    {
        if (is_int($meeting)) {
            $meeting = $this->findOrFail($meeting);
        }

        return DB::transaction(function () use ($meeting, $data) {
            $meeting->update($data);

            if (isset($data['attendee_ids'])) {
                $meeting->attendees()->delete();
                foreach ($data['attendee_ids'] as $attendeeId) {
                    MeetingAttendee::create([
                        'meeting_id' => $meeting->id,
                        'staff_member_id' => $attendeeId,
                        'status' => 'pending',
                    ]);
                }
            }

            return $meeting->fresh($this->defaultRelations);
        });
    }

    /**
     * Delete a meeting.
     */
    public function delete(int|Meeting $meeting): bool
    {
        if (is_int($meeting)) {
            $meeting = $this->findOrFail($meeting);
        }

        return $meeting->delete();
    }

    /**
     * Cancel a meeting.
     */
    public function cancel(int|Meeting $meeting): Meeting
    {
        if (is_int($meeting)) {
            $meeting = $this->findOrFail($meeting);
        }

        $meeting->update(['status' => 'cancelled']);

        return $meeting->fresh($this->defaultRelations);
    }

    /**
     * Complete a meeting.
     */
    public function complete(int|Meeting $meeting): Meeting
    {
        if (is_int($meeting)) {
            $meeting = $this->findOrFail($meeting);
        }

        $meeting->update(['status' => 'completed']);

        return $meeting->fresh($this->defaultRelations);
    }

    /**
     * Add meeting minutes.
     */
    public function addMinutes(int|Meeting $meeting, string $content, int $authorId): MeetingMinutes
    {
        if (is_int($meeting)) {
            $meeting = $this->findOrFail($meeting);
        }

        return MeetingMinutes::create([
            'meeting_id' => $meeting->id,
            'content' => $content,
            'author_id' => $authorId,
        ]);
    }

    /**
     * Add action item.
     */
    public function addActionItem(int|Meeting $meeting, array $data): MeetingActionItem
    {
        if (is_int($meeting)) {
            $meeting = $this->findOrFail($meeting);
        }

        return MeetingActionItem::create([
            'meeting_id' => $meeting->id,
            'description' => $data['description'],
            'assigned_to' => $data['assigned_to'] ?? null,
            'due_date' => $data['due_date'] ?? null,
            'status' => 'pending',
        ]);
    }

    /**
     * Get today's meetings.
     */
    public function getTodaysMeetings(): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->whereDate('start_time', today())
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Get upcoming meetings.
     */
    public function getUpcoming(int $days = 7): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('start_time', '>=', now())
            ->where('start_time', '<=', now()->addDays($days))
            ->where('status', 'scheduled')
            ->orderBy('start_time')
            ->get();
    }

    /**
     * Update attendee response.
     */
    public function updateAttendeeResponse(int $meetingId, int $staffMemberId, string $status): MeetingAttendee
    {
        $attendee = MeetingAttendee::where('meeting_id', $meetingId)
            ->where('staff_member_id', $staffMemberId)
            ->firstOrFail();

        $attendee->update(['status' => $status]);

        return $attendee->fresh();
    }
}
