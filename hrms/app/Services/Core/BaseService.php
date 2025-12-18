<?php

namespace App\Services\Core;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Base Service Class
 *
 * Provides common CRUD operations and utility methods for all services.
 * Each domain service should extend this class and customize as needed.
 */
abstract class BaseService
{
    /**
     * The model class this service works with.
     */
    protected string $modelClass;

    /**
     * Default relations to eager load.
     */
    protected array $defaultRelations = [];

    /**
     * Searchable fields for the model.
     */
    protected array $searchableFields = [];

    /**
     * Filterable fields (field => request_param_name).
     */
    protected array $filterableFields = [];

    /**
     * Default items per page for pagination.
     */
    protected int $perPage = 15;

    /**
     * Get a new query builder instance.
     */
    protected function query(): Builder
    {
        return $this->modelClass::query();
    }

    /**
     * Get all records with optional filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        // Apply filters
        $query = $this->applyFilters($query, $params);

        // Apply search
        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        // Apply ordering
        $query = $this->applyOrdering($query, $params);

        // Paginate or get all
        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Find a record by ID.
     */
    public function findById(int $id, array $relations = []): ?Model
    {
        $relations = ! empty($relations) ? $relations : $this->defaultRelations;

        return $this->query()->with($relations)->find($id);
    }

    /**
     * Find a record by ID or fail.
     */
    public function findOrFail(int $id, array $relations = []): Model
    {
        $relations = ! empty($relations) ? $relations : $this->defaultRelations;

        return $this->query()->with($relations)->findOrFail($id);
    }

    /**
     * Create a new record.
     */
    public function create(array $data): Model
    {
        return DB::transaction(function () use ($data) {
            return $this->modelClass::create($data);
        });
    }

    /**
     * Update an existing record.
     */
    public function update(int|Model $model, array $data): Model
    {
        if (is_int($model)) {
            $model = $this->findOrFail($model);
        }

        return DB::transaction(function () use ($model, $data) {
            $model->update($data);

            return $model->fresh($this->defaultRelations);
        });
    }

    /**
     * Delete a record.
     */
    public function delete(int|Model $model): bool
    {
        if (is_int($model)) {
            $model = $this->findOrFail($model);
        }

        return DB::transaction(function () use ($model) {
            return $model->delete();
        });
    }

    /**
     * Apply filters to the query.
     */
    protected function applyFilters(Builder $query, array $params): Builder
    {
        foreach ($this->filterableFields as $field => $param) {
            if (! empty($params[$param])) {
                $query->where($field, $params[$param]);
            }
        }

        return $query;
    }

    /**
     * Apply search to the query.
     */
    protected function applySearch(Builder $query, string $search): Builder
    {
        if (empty($this->searchableFields)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            foreach ($this->searchableFields as $field) {
                $q->orWhere($field, 'like', "%{$search}%");
            }
        });
    }

    /**
     * Apply ordering to the query.
     */
    protected function applyOrdering(Builder $query, array $params): Builder
    {
        $orderBy = $params['order_by'] ?? 'created_at';
        $order = $params['order'] ?? 'desc';

        return $query->orderBy($orderBy, $order);
    }

    /**
     * Get records for dropdown/select components.
     */
    public function getForDropdown(array $params = [], array $fields = ['id', 'name']): Collection
    {
        $query = $this->query()->select($fields);
        $query = $this->applyFilters($query, $params);

        return $query->orderBy($fields[1] ?? 'id')->get();
    }

    /**
     * Count records with optional filters.
     */
    public function count(array $params = []): int
    {
        $query = $this->query();
        $query = $this->applyFilters($query, $params);

        return $query->count();
    }

    /**
     * Check if a record exists by conditions.
     */
    public function exists(array $conditions): bool
    {
        return $this->query()->where($conditions)->exists();
    }

    /**
     * Find records by conditions.
     */
    public function findWhere(array $conditions, array $relations = []): Collection
    {
        $relations = ! empty($relations) ? $relations : $this->defaultRelations;

        return $this->query()->with($relations)->where($conditions)->get();
    }

    /**
     * Find first record by conditions.
     */
    public function findFirstWhere(array $conditions, array $relations = []): ?Model
    {
        $relations = ! empty($relations) ? $relations : $this->defaultRelations;

        return $this->query()->with($relations)->where($conditions)->first();
    }

    /**
     * Bulk create records.
     */
    public function bulkCreate(array $items): Collection
    {
        return DB::transaction(function () use ($items) {
            $created = collect();
            foreach ($items as $item) {
                $created->push($this->modelClass::create($item));
            }

            return $created;
        });
    }

    /**
     * Bulk update records by IDs.
     */
    public function bulkUpdate(array $ids, array $data): int
    {
        return DB::transaction(function () use ($ids, $data) {
            return $this->query()->whereIn('id', $ids)->update($data);
        });
    }

    /**
     * Bulk delete records by IDs.
     */
    public function bulkDelete(array $ids): int
    {
        return DB::transaction(function () use ($ids) {
            return $this->query()->whereIn('id', $ids)->delete();
        });
    }
}
