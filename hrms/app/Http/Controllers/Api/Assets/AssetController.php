<?php

namespace App\Http\Controllers\Api\Assets;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AssetController extends Controller
{
    use ApiResponse;

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

        return $this->success($assets);
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
            return $this->validationError($validator->errors());
        }

        $data = $request->all();
        $data['asset_code'] = 'AST-'.strtoupper(Str::random(8));
        $data['status'] = 'available';
        $data['current_value'] = $data['purchase_cost'] ?? 0;

        $asset = Asset::create($data);

        return $this->created($asset->load('assetType'), 'Asset created successfully');
    }

    public function show(Asset $asset)
    {
        $asset->load(['assetType', 'assignedEmployee', 'assignments.staffMember']);

        return $this->success($asset);
    }

    public function update(Request $request, Asset $asset)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'asset_type_id' => 'sometimes|required|exists:asset_types,id',
            'condition' => 'nullable|in:new,good,fair,poor',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $asset->update($request->all());

        return $this->success($asset->load('assetType'), 'Asset updated successfully');
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();

        return $this->noContent('Asset deleted successfully');
    }

    public function assign(Request $request, Asset $asset)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_id' => 'required|exists:staff_members,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        if ($asset->status === 'assigned') {
            return $this->error('Asset is already assigned', 400);
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

        return $this->success($asset->load(['assetType', 'assignedEmployee']), 'Asset assigned successfully');
    }

    public function returnAsset(Request $request, Asset $asset)
    {
        if ($asset->status !== 'assigned') {
            return $this->error('Asset is not currently assigned', 400);
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

        return $this->success($asset->load('assetType'), 'Asset returned successfully');
    }

    public function setMaintenance(Request $request, Asset $asset)
    {
        $asset->update(['status' => 'maintenance']);

        return $this->success($asset, 'Asset marked for maintenance');
    }

    public function available()
    {
        $assets = Asset::available()->with('assetType')->get();

        return $this->success($assets);
    }

    public function byEmployee($staffMemberId)
    {
        $assets = Asset::where('assigned_to', $staffMemberId)
            ->with('assetType')
            ->get();

        return $this->success($assets);
    }
}
