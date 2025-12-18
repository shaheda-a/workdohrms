<?php

namespace App\Http\Controllers\Api\Assets;

use App\Http\Controllers\Controller;
use App\Models\AssetType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AssetTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = AssetType::withCount('assets');

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $assetTypes = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $assetTypes,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'depreciation_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assetType = AssetType::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Asset type created successfully',
            'data' => $assetType,
        ], 201);
    }

    public function show(AssetType $assetType)
    {
        $assetType->load('assets');

        return response()->json([
            'success' => true,
            'data' => $assetType,
        ]);
    }

    public function update(Request $request, AssetType $assetType)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'depreciation_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assetType->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Asset type updated successfully',
            'data' => $assetType,
        ]);
    }

    public function destroy(AssetType $assetType)
    {
        $assetType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asset type deleted successfully',
        ]);
    }
}
