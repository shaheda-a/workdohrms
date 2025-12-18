<?php

namespace App\Http\Controllers\Api\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TrainingProgramController extends Controller
{
    public function index(Request $request)
    {
        $query = TrainingProgram::with('trainingType')->withCount('sessions');

        if ($request->training_type_id) {
            $query->where('training_type_id', $request->training_type_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $programs = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $programs,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'training_type_id' => 'required|exists:training_types,id',
            'description' => 'nullable|string',
            'duration' => 'nullable|string|max:100',
            'cost' => 'nullable|numeric|min:0',
            'trainer_name' => 'nullable|string|max:255',
            'trainer_type' => 'nullable|in:internal,external',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $program = TrainingProgram::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Training program created successfully',
            'data' => $program->load('trainingType'),
        ], 201);
    }

    public function show(TrainingProgram $trainingProgram)
    {
        $trainingProgram->load(['trainingType', 'sessions.participants']);

        return response()->json([
            'success' => true,
            'data' => $trainingProgram,
        ]);
    }

    public function update(Request $request, TrainingProgram $trainingProgram)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'training_type_id' => 'sometimes|required|exists:training_types,id',
            'status' => 'nullable|in:active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $trainingProgram->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Training program updated successfully',
            'data' => $trainingProgram->load('trainingType'),
        ]);
    }

    public function destroy(TrainingProgram $trainingProgram)
    {
        $trainingProgram->delete();

        return response()->json([
            'success' => true,
            'message' => 'Training program deleted successfully',
        ]);
    }
}
