<?php

namespace App\Http\Controllers\Api\Assets;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $query = Asset::with(['assetType', 'assignedEmployee']);

        if ($request->asset_type_id) {
            $query->where('asset_type_id', $request->asset_type_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('serial_number', 'like', "%{$request->search}%")
                    ->orWhere('asset_code', 'like', "%{$request->search}%");
            });
        }

        $assets = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $assets,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'asset_type_id' => 'required|exists:asset_types,id',
            'serial_number' => 'nullable|string|max:255',
            'purchase_date' => 'nullable|date',
            'purchase_cost' => 'nullable|numeric|min:0',
            'condition' => 'nullable|in:new,good,fair,poor',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['asset_code'] = 'AST-'.strtoupper(Str::random(8));
        $data['status'] = 'available';
        $data['current_value'] = $data['purchase_cost'] ?? 0;

        $asset = Asset::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Asset created successfully',
            'data' => $asset->load('assetType'),
        ], 201);
    }

    public function show(Asset $asset)
    {
        $asset->load(['assetType', 'assignedEmployee', 'assignments.staffMember']);

        return response()->json([
            'success' => true,
            'data' => $asset,
        ]);
    }

    public function update(Request $request, Asset $asset)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'asset_type_id' => 'sometimes|required|exists:asset_types,id',
            'condition' => 'nullable|in:new,good,fair,poor',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $asset->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Asset updated successfully',
            'data' => $asset->load('assetType'),
        ]);
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asset deleted successfully',
        ]);
    }

    public function assign(Request $request, Asset $asset)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_id' => 'required|exists:staff_members,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($asset->status === 'assigned') {
            return response()->json([
                'success' => false,
                'message' => 'Asset is already assigned',
            ], 400);
        }

        // Create assignment record
        AssetAssignment::create([
            'asset_id' => $asset->id,
            'staff_member_id' => $request->staff_member_id,
            'assigned_date' => now(),
            'assigned_by' => auth()->id(),
            'notes' => $request->notes,
        ]);

        // Update asset
        $asset->update([
            'status' => 'assigned',
            'assigned_to' => $request->staff_member_id,
            'assigned_date' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset assigned successfully',
            'data' => $asset->load(['assetType', 'assignedEmployee']),
        ]);
    }

    public function returnAsset(Request $request, Asset $asset)
    {
        if ($asset->status !== 'assigned') {
            return response()->json([
                'success' => false,
                'message' => 'Asset is not currently assigned',
            ], 400);
        }

        // Update last assignment record
        $lastAssignment = $asset->assignments()->whereNull('returned_date')->first();
        if ($lastAssignment) {
            $lastAssignment->update([
                'returned_date' => now(),
                'notes' => $request->notes ?? $lastAssignment->notes,
            ]);
        }

        // Update asset
        $asset->update([
            'status' => 'available',
            'assigned_to' => null,
            'assigned_date' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asset returned successfully',
            'data' => $asset->load('assetType'),
        ]);
    }

    public function setMaintenance(Request $request, Asset $asset)
    {
        $asset->update(['status' => 'maintenance']);

        return response()->json([
            'success' => true,
            'message' => 'Asset marked for maintenance',
            'data' => $asset,
        ]);
    }

    public function available()
    {
        $assets = Asset::available()->with('assetType')->get();

        return response()->json([
            'success' => true,
            'data' => $assets,
        ]);
    }

    public function byEmployee($staffMemberId)
    {
        $assets = Asset::where('assigned_to', $staffMemberId)
            ->with('assetType')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assets,
        ]);
    }
}
