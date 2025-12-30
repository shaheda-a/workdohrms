<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\MeetingRoom;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeetingRoomController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = MeetingRoom::query();
        if ($request->status) {
            $query->where('status', $request->status);
        }
        $rooms = $query->get();

        return $this->success($rooms);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'equipment' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $room = MeetingRoom::create($request->all());

        return $this->created($room, 'Created');
    }

    public function show(MeetingRoom $meetingRoom)
    {
        return $this->success($meetingRoom);
    }

    public function update(Request $request, MeetingRoom $meetingRoom)
    {
        $meetingRoom->update($request->all());

        return $this->success($meetingRoom, 'Updated');
    }

    public function destroy(MeetingRoom $meetingRoom)
    {
        $meetingRoom->delete();

        return $this->noContent('Deleted');
    }

    public function available(Request $request)
    {
        $rooms = MeetingRoom::available()->get();

        return $this->success($rooms);
    }
}
