<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\MeetingActionItem;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeetingActionItemController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = MeetingActionItem::with(['meeting', 'assignedEmployee']);

        if ($request->meeting_id) {
            $query->where('meeting_id', $request->meeting_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $items = $query->latest()->paginate($request->per_page ?? 15);

        return $this->success($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'meeting_id' => 'required|exists:meetings,id',
            'title' => 'required|string|max:255',
            'assigned_to' => 'nullable|exists:staff_members,id',
            'due_date' => 'nullable|date',
            'status' => 'nullable|in:pending,in_progress,completed',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $item = MeetingActionItem::create($request->all());

        return $this->created($item->load(['meeting', 'assignedEmployee']), 'Action item added');
    }

    public function show(MeetingActionItem $meetingActionItem)
    {
        return $this->success($meetingActionItem->load(['meeting', 'assignedEmployee']));
    }

    public function update(Request $request, MeetingActionItem $meetingActionItem)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'assigned_to' => 'nullable|exists:staff_members,id',
            'due_date' => 'nullable|date',
            'status' => 'nullable|in:pending,in_progress,completed',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $meetingActionItem->update($request->all());

        return $this->success($meetingActionItem->load(['meeting', 'assignedEmployee']), 'Action item updated');
    }

    public function destroy(MeetingActionItem $meetingActionItem)
    {
        $meetingActionItem->delete();

        return $this->noContent('Action item deleted');
    }
}
