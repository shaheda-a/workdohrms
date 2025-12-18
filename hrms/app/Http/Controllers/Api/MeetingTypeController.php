<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MeetingType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeetingTypeController extends Controller
{
    public function index(Request $request)
    {
        $types = MeetingType::withCount('meetings')->get();
        return response()->json(['success' => true, 'data' => $types]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'default_duration' => 'nullable|integer|min:15',
            'color' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = MeetingType::create($request->all());
        return response()->json(['success' => true, 'message' => 'Created', 'data' => $type], 201);
    }

    public function show(MeetingType $meetingType)
    {
        return response()->json(['success' => true, 'data' => $meetingType]);
    }

    public function update(Request $request, MeetingType $meetingType)
    {
        $meetingType->update($request->all());
        return response()->json(['success' => true, 'message' => 'Updated', 'data' => $meetingType]);
    }

    public function destroy(MeetingType $meetingType)
    {
        $meetingType->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }
}
