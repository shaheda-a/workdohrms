<?php

namespace App\Http\Controllers\Api\Assets;

use App\Http\Controllers\Controller;
use App\Models\AssetType;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AssetTypeController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = AssetType::withCount('assets');

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $assetTypes = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return $this->success($assetTypes);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'depreciation_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $assetType = AssetType::create($request->all());

        return $this->created($assetType, 'Asset type created successfully');
    }

    public function show(AssetType $assetType)
    {
        $assetType->load('assets');

        return $this->success($assetType);
    }

    public function update(Request $request, AssetType $assetType)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'depreciation_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $assetType->update($request->all());

        return $this->success($assetType, 'Asset type updated successfully');
    }

    public function destroy(AssetType $assetType)
    {
        $assetType->delete();

        return $this->noContent('Asset type deleted successfully');
    }
}
