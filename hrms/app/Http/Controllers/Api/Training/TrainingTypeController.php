<?php

namespace App\Http\Controllers\Api\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingType;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TrainingTypeController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = TrainingType::withCount('programs');

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $types = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return $this->success($types);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_duration' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $type = TrainingType::create($request->all());

        return $this->created($type, 'Training type created successfully');
    }

    public function show(TrainingType $trainingType)
    {
        $trainingType->load('programs');

        return $this->success($trainingType);
    }

    public function update(Request $request, TrainingType $trainingType)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'default_duration' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $trainingType->update($request->all());

        return $this->success($trainingType, 'Training type updated successfully');
    }

    public function destroy(TrainingType $trainingType)
    {
        $trainingType->delete();

        return $this->noContent('Training type deleted successfully');
    }
}
