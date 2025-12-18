<?php

namespace App\Services\Assets;
use App\Services\Core\BaseService;

use App\Models\Asset;
use App\Models\AssetAssignment;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Asset Service
 *
 * Handles all business logic for asset management.
 */
class AssetService extends BaseService
{
    protected string $modelClass = Asset::class;

    protected array $defaultRelations = [
        'assetType',
        'assignedEmployee',
    ];

    protected array $searchableFields = [
        'name',
        'serial_number',
        'asset_code',
    ];

    protected array $filterableFields = [
        'asset_type_id' => 'asset_type_id',
        'status' => 'status',
    ];

    /**
     * Get all assets with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new asset.
     */
    public function create(array $data): Asset
    {
        return DB::transaction(function () use ($data) {
            $data['asset_code'] = 'AST-'.strtoupper(Str::random(8));
            $data['status'] = 'available';
            $data['current_value'] = $data['purchase_cost'] ?? 0;

            $asset = Asset::create($data);

            return $asset->load($this->defaultRelations);
        });
    }

    /**
     * Get asset with full details.
     */
    public function getWithDetails(int $id): Asset
    {
        return $this->query()
            ->with([
                'assetType',
                'assignedEmployee',
                'assignments.staffMember',
            ])
            ->findOrFail($id);
    }

    /**
     * Update an asset.
     */
    public function update(int|Asset $asset, array $data): Asset
    {
        if (is_int($asset)) {
            $asset = $this->findOrFail($asset);
        }

        return DB::transaction(function () use ($asset, $data) {
            $asset->update($data);

            return $asset->fresh($this->defaultRelations);
        });
    }

    /**
     * Delete an asset.
     */
    public function delete(int|Asset $asset): bool
    {
        if (is_int($asset)) {
            $asset = $this->findOrFail($asset);
        }

        return $asset->delete();
    }

    /**
     * Assign asset to an employee.
     */
    public function assign(int|Asset $asset, int $staffMemberId, ?int $assignedBy = null, ?string $notes = null): Asset
    {
        if (is_int($asset)) {
            $asset = $this->findOrFail($asset);
        }

        if ($asset->status === 'assigned') {
            throw new \Exception('Asset is already assigned');
        }

        return DB::transaction(function () use ($asset, $staffMemberId, $assignedBy, $notes) {
            AssetAssignment::create([
                'asset_id' => $asset->id,
                'staff_member_id' => $staffMemberId,
                'assigned_date' => now(),
                'assigned_by' => $assignedBy,
                'notes' => $notes,
            ]);

            $asset->update([
                'status' => 'assigned',
                'assigned_to' => $staffMemberId,
                'assigned_date' => now(),
            ]);

            return $asset->fresh(['assetType', 'assignedEmployee']);
        });
    }

    /**
     * Return an asset.
     */
    public function returnAsset(int|Asset $asset, ?string $notes = null): Asset
    {
        if (is_int($asset)) {
            $asset = $this->findOrFail($asset);
        }

        if ($asset->status !== 'assigned') {
            throw new \Exception('Asset is not currently assigned');
        }

        return DB::transaction(function () use ($asset, $notes) {
            $lastAssignment = $asset->assignments()->whereNull('returned_date')->first();
            if ($lastAssignment) {
                $lastAssignment->update([
                    'returned_date' => now(),
                    'notes' => $notes ?? $lastAssignment->notes,
                ]);
            }

            $asset->update([
                'status' => 'available',
                'assigned_to' => null,
                'assigned_date' => null,
            ]);

            return $asset->fresh('assetType');
        });
    }

    /**
     * Set asset for maintenance.
     */
    public function setMaintenance(int|Asset $asset): Asset
    {
        if (is_int($asset)) {
            $asset = $this->findOrFail($asset);
        }

        $asset->update(['status' => 'maintenance']);

        return $asset->fresh();
    }

    /**
     * Get available assets.
     */
    public function getAvailable(): Collection
    {
        return $this->query()
            ->where('status', 'available')
            ->with('assetType')
            ->get();
    }

    /**
     * Get assets by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->where('assigned_to', $staffMemberId)
            ->with('assetType')
            ->get();
    }

    /**
     * Get asset statistics.
     */
    public function getStatistics(): array
    {
        return [
            'total' => Asset::count(),
            'available' => Asset::where('status', 'available')->count(),
            'assigned' => Asset::where('status', 'assigned')->count(),
            'maintenance' => Asset::where('status', 'maintenance')->count(),
            'total_value' => Asset::sum('current_value'),
        ];
    }
}
