<?php

namespace App\Services\Assets;
use App\Services\Core\BaseService;

use App\Models\AssetType;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Asset Type Service
 *
 * Handles all business logic for asset type management.
 */
class AssetTypeService extends BaseService
{
    protected string $modelClass = AssetType::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'name',
    ];

    /**
     * Get all asset types.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query();

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
     * Create a new asset type.
     */
    public function create(array $data): AssetType
    {
        return AssetType::create($data);
    }

    /**
     * Update an asset type.
     */
    public function update(int|AssetType $type, array $data): AssetType
    {
        if (is_int($type)) {
            $type = $this->findOrFail($type);
        }

        $type->update($data);

        return $type->fresh();
    }

    /**
     * Delete an asset type.
     */
    public function delete(int|AssetType $type): bool
    {
        if (is_int($type)) {
            $type = $this->findOrFail($type);
        }

        return $type->delete();
    }

    /**
     * Get types for dropdown.
     */
    public function getForDropdown(): Collection
    {
        return $this->query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get();
    }
}
