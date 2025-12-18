<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContractType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContractTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = ContractType::withCount('contracts');
        $types = $request->paginate === 'false' ? $query->get() : $query->paginate($request->per_page ?? 15);
        return response()->json(['success' => true, 'data' => $types]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_duration_months' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = ContractType::create($request->all());
        return response()->json(['success' => true, 'message' => 'Contract type created', 'data' => $type], 201);
    }

    public function show(ContractType $contractType)
    {
        return response()->json(['success' => true, 'data' => $contractType]);
    }

    public function update(Request $request, ContractType $contractType)
    {
        $contractType->update($request->all());
        return response()->json(['success' => true, 'message' => 'Updated', 'data' => $contractType]);
    }

    public function destroy(ContractType $contractType)
    {
        $contractType->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }
}
