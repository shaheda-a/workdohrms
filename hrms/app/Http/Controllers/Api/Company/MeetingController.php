<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Models\MeetingActionItem;
use App\Models\MeetingAttendee;
use App\Models\MeetingMinutes;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeetingController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = Meeting::with(['meetingType', 'meetingRoom', 'attendees.staffMember']);

        if ($request->date) {
            $query->whereDate('date', $request->date);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $meetings = $query->orderBy('date')->orderBy('start_time')->paginate($request->per_page ?? 15);

        return $this->success($meetings);
    }

    public function show(Meeting $meeting)
    {
        return $this->success($meeting->load([
            'meetingType',
            'meetingRoom',
            'attendees.staffMember',
            'minutes.creator',
            'actionItems.assignedEmployee'
        ]));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'meeting_type_id' => 'nullable|exists:meeting_types,id',
            'meeting_room_id' => 'nullable|exists:meeting_rooms,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'nullable|string',
            'meeting_link' => 'nullable|url',
            'is_recurring' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|array',
            'attendee_ids' => 'nullable|array',
            'attendee_ids.*' => 'exists:staff_members,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $meeting = Meeting::create([
            'title' => $request->title,
            'meeting_type_id' => $request->meeting_type_id,
            'meeting_room_id' => $request->meeting_room_id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'description' => $request->description,
            'meeting_link' => $request->meeting_link,
            'is_recurring' => $request->is_recurring ?? false,
            'recurrence_pattern' => $request->recurrence_pattern,
            'created_by' => auth()->id(),
            'status' => 'scheduled',
        ]);

        // Add attendees
        if ($request->attendee_ids) {
            foreach ($request->attendee_ids as $index => $staffMemberId) {
                MeetingAttendee::create([
                    'meeting_id' => $meeting->id,
                    'staff_member_id' => $staffMemberId,
                    'is_organizer' => $index === 0,
                ]);
            }
        }

        return $this->created($meeting->load(['meetingType', 'meetingRoom', 'attendees.staffMember']), 'Meeting created');
    }

    public function update(Request $request, Meeting $meeting)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'meeting_type_id' => 'nullable|exists:meeting_types,id',
            'meeting_room_id' => 'nullable|exists:meeting_rooms,id',
            'date' => 'sometimes|required|date',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'sometimes|required|date_format:H:i|after:start_time',
            'description' => 'nullable|string',
            'meeting_link' => 'nullable|url',
            'status' => 'sometimes|required|in:scheduled,in_progress,completed,cancelled',
            'is_recurring' => 'nullable|boolean',
            'recurrence_pattern' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $meeting->update($request->all());

        return $this->success($meeting->load(['meetingType', 'meetingRoom', 'attendees.staffMember']), 'Updated');
    }

    public function destroy(Meeting $meeting)
    {
        $meeting->delete();

        return $this->noContent('Deleted');
    }

    public function addAttendees(Request $request, Meeting $meeting)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_ids' => 'required|array',
            'staff_member_ids.*' => 'exists:staff_members,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        foreach ($request->staff_member_ids as $staffMemberId) {
            MeetingAttendee::firstOrCreate([
                'meeting_id' => $meeting->id,
                'staff_member_id' => $staffMemberId,
            ]);
        }

        return $this->success($meeting->load('attendees.staffMember'), 'Attendees added');
    }

    public function start(Meeting $meeting)
    {
        $meeting->update(['status' => 'in_progress']);

        return $this->success($meeting, 'Meeting started');
    }

    public function complete(Meeting $meeting)
    {
        $meeting->update(['status' => 'completed']);

        return $this->success($meeting, 'Meeting completed');
    }

    public function addMinutes(Request $request, Meeting $meeting)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $minutes = MeetingMinutes::create([
            'meeting_id' => $meeting->id,
            'content' => $request->content,
            'created_by' => auth()->id(),
        ]);

        return $this->success($minutes->load('creator'), 'Minutes added');
    }

    public function addActionItem(Request $request, Meeting $meeting)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'assigned_to' => 'nullable|exists:staff_members,id',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $item = MeetingActionItem::create([
            'meeting_id' => $meeting->id,
            'title' => $request->title,
            'assigned_to' => $request->assigned_to,
            'due_date' => $request->due_date,
        ]);

        return $this->success($item->load('assignedEmployee'), 'Action item added');
    }

    public function completeActionItem(MeetingActionItem $meetingActionItem)
    {
        $meetingActionItem->update(['status' => 'completed']);

        return $this->success($meetingActionItem, 'Action item completed');
    }

    public function calendar(Request $request)
    {
        $query = Meeting::with(['meetingType', 'meetingRoom']);

        if ($request->month && $request->year) {
            $query->whereMonth('date', $request->month)->whereYear('date', $request->year);
        }

        return $this->success($query->get());
    }

    public function myMeetings()
    {
        $staffMember = auth()->user()->staffMember;
        if (! $staffMember) {
            return $this->success([]);
        }

        $meetingIds = MeetingAttendee::where('staff_member_id', $staffMember->id)->pluck('meeting_id');
        $meetings = Meeting::whereIn('id', $meetingIds)
            ->with(['meetingType', 'meetingRoom'])
            ->orderBy('date')
            ->get();

        return $this->success($meetings);
    }
}
