<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\MeetingMinutes;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeetingMinutesController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = MeetingMinutes::with(['meeting', 'creator']);

        if ($request->meeting_id) {
            $query->where('meeting_id', $request->meeting_id);
        }

        if ($request->search) {
            $query->where('content', 'like', '%' . $request->search . '%');
        }

        $minutes = $query->latest()->paginate($request->per_page ?? 15);

        return $this->success($minutes);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'meeting_id' => 'required|exists:meetings,id',
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $minutes = MeetingMinutes::create([
            'meeting_id' => $request->meeting_id,
            'content' => $request->content,
            'created_by' => auth()->id(),
        ]);

        return $this->created($minutes->load(['meeting', 'creator']), 'Minutes added');
    }

    public function show(MeetingMinutes $meetingMinute)
    {
        return $this->success($meetingMinute->load(['meeting', 'creator']));
    }

    public function update(Request $request, MeetingMinutes $meetingMinute)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $meetingMinute->update($request->all());

        return $this->success($meetingMinute->load(['meeting', 'creator']), 'Minutes updated');
    }

    public function destroy(MeetingMinutes $meetingMinute)
    {
        $meetingMinute->delete();

        return $this->noContent('Minutes deleted');
    }
}
