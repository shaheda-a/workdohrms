<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\MeetingType;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MeetingTypeController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $types = MeetingType::withCount('meetings')->get();

        return $this->success($types);
    }

    public function store(Request $request)
    {
        // ADDED: meeting type status support
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'default_duration' => 'nullable|integer|min:15',
            'color' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $type = MeetingType::create($request->all());

        return $this->created($type, 'Created');
    }

    public function show(MeetingType $meetingType)
    {
        return $this->success($meetingType);
    }

    public function update(Request $request, MeetingType $meetingType)
    {
        // ADDED: meeting type status support
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'default_duration' => 'nullable|integer|min:15',
            'color' => 'nullable|string|max:20',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $meetingType->update($request->all());

        return $this->success($meetingType, 'Updated');
    }

    public function destroy(MeetingType $meetingType)
    {
        $meetingType->delete();

        return $this->noContent('Deleted');
    }
}
