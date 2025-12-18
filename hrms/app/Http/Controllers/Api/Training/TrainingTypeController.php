<?php

namespace App\Http\Controllers\Api\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TrainingTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = TrainingType::withCount('programs');

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $types = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $types,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_duration' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = TrainingType::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Training type created successfully',
            'data' => $type,
        ], 201);
    }

    public function show(TrainingType $trainingType)
    {
        $trainingType->load('programs');

        return response()->json([
            'success' => true,
            'data' => $trainingType,
        ]);
    }

    public function update(Request $request, TrainingType $trainingType)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'default_duration' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $trainingType->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Training type updated successfully',
            'data' => $trainingType,
        ]);
    }

    public function destroy(TrainingType $trainingType)
    {
        $trainingType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Training type deleted successfully',
        ]);
    }
}
