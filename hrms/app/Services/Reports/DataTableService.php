<?php

namespace App\Services\Reports;

use Illuminate\Database\Eloquent\Builder;

/**
 * Data Table Service
 *
 * Handles all business logic for data table operations (sorting, filtering, pagination).
 */
class DataTableService
{
    /**
     * Apply data table parameters to query.
     */
    public function applyDataTableParams(Builder $query, array $params): Builder
    {
        if (! empty($params['search'])) {
            $query = $this->applyGlobalSearch($query, $params['search'], $params['searchable_columns'] ?? []);
        }

        if (! empty($params['filters'])) {
            $query = $this->applyFilters($query, $params['filters']);
        }

        if (! empty($params['sort_by'])) {
            $query = $this->applySorting($query, $params['sort_by'], $params['sort_direction'] ?? 'asc');
        }

        return $query;
    }

    /**
     * Apply global search across multiple columns.
     */
    public function applyGlobalSearch(Builder $query, string $search, array $columns): Builder
    {
        if (empty($columns)) {
            return $query;
        }

        return $query->where(function ($q) use ($search, $columns) {
            foreach ($columns as $column) {
                if (str_contains($column, '.')) {
                    [$relation, $field] = explode('.', $column, 2);
                    $q->orWhereHas($relation, function ($subQ) use ($field, $search) {
                        $subQ->where($field, 'like', "%{$search}%");
                    });
                } else {
                    $q->orWhere($column, 'like', "%{$search}%");
                }
            }
        });
    }

    /**
     * Apply column filters.
     */
    public function applyFilters(Builder $query, array $filters): Builder
    {
        foreach ($filters as $column => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            if (is_array($value)) {
                if (isset($value['from']) && isset($value['to'])) {
                    $query->whereBetween($column, [$value['from'], $value['to']]);
                } else {
                    $query->whereIn($column, $value);
                }
            } else {
                $query->where($column, $value);
            }
        }

        return $query;
    }

    /**
     * Apply sorting.
     */
    public function applySorting(Builder $query, string $column, string $direction = 'asc'): Builder
    {
        $direction = strtolower($direction) === 'desc' ? 'desc' : 'asc';

        if (str_contains($column, '.')) {
            return $query;
        }

        return $query->orderBy($column, $direction);
    }

    /**
     * Paginate results with data table format.
     */
    public function paginate(Builder $query, array $params): array
    {
        $perPage = $params['per_page'] ?? 15;
        $page = $params['page'] ?? 1;

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    /**
     * Get data table response.
     */
    public function getDataTableResponse(Builder $query, array $params): array
    {
        $query = $this->applyDataTableParams($query, $params);

        return $this->paginate($query, $params);
    }
}
