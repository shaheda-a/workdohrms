<?php

namespace App\Http\Controllers\Api\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingProgram;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TrainingProgramController extends Controller
{
    use ApiResponse;

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

        return $this->success($programs);
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
            return $this->validationError($validator->errors());
        }

        $program = TrainingProgram::create($request->all());

        return $this->created($program->load('trainingType'), 'Training program created successfully');
    }

    public function show(TrainingProgram $trainingProgram)
    {
        $trainingProgram->load(['trainingType', 'sessions.participants']);

        return $this->success($trainingProgram);
    }

    public function update(Request $request, TrainingProgram $trainingProgram)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'training_type_id' => 'sometimes|required|exists:training_types,id',
            'status' => 'nullable|in:active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $trainingProgram->update($request->all());

        return $this->success($trainingProgram->load('trainingType'), 'Training program updated successfully');
    }

    public function destroy(TrainingProgram $trainingProgram)
    {
        $trainingProgram->delete();

        return $this->noContent('Training program deleted successfully');
    }
}
