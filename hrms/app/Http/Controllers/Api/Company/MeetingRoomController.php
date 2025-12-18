<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\MeetingRoom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeetingRoomController extends Controller
{
    public function index(Request $request)
    {
        $query = MeetingRoom::query();
        if ($request->status) {
            $query->where('status', $request->status);
        }
        $rooms = $query->get();

        return response()->json(['success' => true, 'data' => $rooms]);
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
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $room = MeetingRoom::create($request->all());

        return response()->json(['success' => true, 'message' => 'Created', 'data' => $room], 201);
    }

    public function show(MeetingRoom $meetingRoom)
    {
        return response()->json(['success' => true, 'data' => $meetingRoom]);
    }

    public function update(Request $request, MeetingRoom $meetingRoom)
    {
        $meetingRoom->update($request->all());

        return response()->json(['success' => true, 'message' => 'Updated', 'data' => $meetingRoom]);
    }

    public function destroy(MeetingRoom $meetingRoom)
    {
        $meetingRoom->delete();

        return response()->json(['success' => true, 'message' => 'Deleted']);
    }

    public function available(Request $request)
    {
        $rooms = MeetingRoom::available()->get();

        return response()->json(['success' => true, 'data' => $rooms]);
    }
}
