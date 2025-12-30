<?php

namespace App\Http\Controllers\Api\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingParticipant;
use App\Models\TrainingSession;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TrainingSessionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = TrainingSession::with(['program.trainingType', 'trainer'])
            ->withCount('participants');

        if ($request->training_program_id) {
            $query->where('training_program_id', $request->training_program_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->date_from) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('date', '<=', $request->date_to);
        }

        $sessions = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return $this->success($sessions);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'training_program_id' => 'required|exists:training_programs,id',
            'session_name' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'trainer_id' => 'nullable|exists:staff_members,id',
            'max_participants' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $session = TrainingSession::create($request->all());

        return $this->created($session->load('program'), 'Training session created successfully');
    }

    public function show(TrainingSession $trainingSession)
    {
        $trainingSession->load(['program.trainingType', 'trainer', 'participants.staffMember']);

        return $this->success($trainingSession);
    }

    public function update(Request $request, TrainingSession $trainingSession)
    {
        $validator = Validator::make($request->all(), [
            'session_name' => 'sometimes|required|string|max:255',
            'date' => 'sometimes|required|date',
            'status' => 'nullable|in:scheduled,in_progress,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $trainingSession->update($request->all());

        return $this->success($trainingSession->load('program'), 'Training session updated successfully');
    }

    public function destroy(TrainingSession $trainingSession)
    {
        $trainingSession->delete();

        return $this->noContent('Training session deleted successfully');
    }

    public function enroll(Request $request, TrainingSession $trainingSession)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_id' => 'required|exists:staff_members,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // Check if already enrolled
        $existing = TrainingParticipant::where('training_session_id', $trainingSession->id)
            ->where('staff_member_id', $request->staff_member_id)
            ->first();

        if ($existing) {
            return $this->error('Employee is already enrolled in this session', 400);
        }

        // Check capacity
        $currentCount = $trainingSession->participants()->count();
        if ($currentCount >= $trainingSession->max_participants) {
            return $this->error('Session is at full capacity', 400);
        }

        $participant = TrainingParticipant::create([
            'training_session_id' => $trainingSession->id,
            'staff_member_id' => $request->staff_member_id,
            'status' => 'enrolled',
        ]);

        return $this->success($participant->load('staffMember'), 'Employee enrolled successfully');
    }

    public function complete(Request $request, TrainingSession $trainingSession)
    {
        $trainingSession->update(['status' => 'completed']);

        return $this->success($trainingSession, 'Training session marked as completed');
    }

    public function employeeTraining($staffMemberId)
    {
        $trainings = TrainingParticipant::where('staff_member_id', $staffMemberId)
            ->with(['session.program.trainingType'])
            ->get();

        return $this->success($trainings);
    }
}
