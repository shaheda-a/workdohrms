<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingSession;
use App\Models\TrainingParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TrainingSessionController extends Controller
{
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

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
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
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $session = TrainingSession::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Training session created successfully',
            'data' => $session->load('program')
        ], 201);
    }

    public function show(TrainingSession $trainingSession)
    {
        $trainingSession->load(['program.trainingType', 'trainer', 'participants.staffMember']);
        return response()->json([
            'success' => true,
            'data' => $trainingSession
        ]);
    }

    public function update(Request $request, TrainingSession $trainingSession)
    {
        $validator = Validator::make($request->all(), [
            'session_name' => 'sometimes|required|string|max:255',
            'date' => 'sometimes|required|date',
            'status' => 'nullable|in:scheduled,in_progress,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $trainingSession->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Training session updated successfully',
            'data' => $trainingSession->load('program')
        ]);
    }

    public function destroy(TrainingSession $trainingSession)
    {
        $trainingSession->delete();

        return response()->json([
            'success' => true,
            'message' => 'Training session deleted successfully'
        ]);
    }

    public function enroll(Request $request, TrainingSession $trainingSession)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_id' => 'required|exists:staff_members,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if already enrolled
        $existing = TrainingParticipant::where('training_session_id', $trainingSession->id)
            ->where('staff_member_id', $request->staff_member_id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Employee is already enrolled in this session'
            ], 400);
        }

        // Check capacity
        $currentCount = $trainingSession->participants()->count();
        if ($currentCount >= $trainingSession->max_participants) {
            return response()->json([
                'success' => false,
                'message' => 'Session is at full capacity'
            ], 400);
        }

        $participant = TrainingParticipant::create([
            'training_session_id' => $trainingSession->id,
            'staff_member_id' => $request->staff_member_id,
            'status' => 'enrolled',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Employee enrolled successfully',
            'data' => $participant->load('staffMember')
        ]);
    }

    public function complete(Request $request, TrainingSession $trainingSession)
    {
        $trainingSession->update(['status' => 'completed']);

        return response()->json([
            'success' => true,
            'message' => 'Training session marked as completed',
            'data' => $trainingSession
        ]);
    }

    public function employeeTraining($staffMemberId)
    {
        $trainings = TrainingParticipant::where('staff_member_id', $staffMemberId)
            ->with(['session.program.trainingType'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $trainings
        ]);
    }
}
