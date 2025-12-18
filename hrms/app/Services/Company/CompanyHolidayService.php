<?php

namespace App\Services\Company;
use App\Services\Core\BaseService;

use App\Models\CompanyHoliday;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Company Holiday Service
 *
 * Handles all business logic for company holiday management.
 */
class CompanyHolidayService extends BaseService
{
    protected string $modelClass = CompanyHoliday::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'name',
    ];

    /**
     * Get all holidays with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query();

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['year'])) {
            $query->whereYear('date', $params['year']);
        }

        $query->orderBy('date');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new holiday.
     */
    public function create(array $data): CompanyHoliday
    {
        return CompanyHoliday::create($data);
    }

    /**
     * Update a holiday.
     */
    public function update(int|CompanyHoliday $holiday, array $data): CompanyHoliday
    {
        if (is_int($holiday)) {
            $holiday = $this->findOrFail($holiday);
        }

        $holiday->update($data);

        return $holiday->fresh();
    }

    /**
     * Delete a holiday.
     */
    public function delete(int|CompanyHoliday $holiday): bool
    {
        if (is_int($holiday)) {
            $holiday = $this->findOrFail($holiday);
        }

        return $holiday->delete();
    }

    /**
     * Get holidays for a specific year.
     */
    public function getByYear(int $year): Collection
    {
        return $this->query()
            ->whereYear('date', $year)
            ->orderBy('date')
            ->get();
    }

    /**
     * Check if a date is a holiday.
     */
    public function isHoliday(string $date): bool
    {
        return $this->query()
            ->whereDate('date', $date)
            ->exists();
    }

    /**
     * Get upcoming holidays.
     */
    public function getUpcoming(int $count = 5): Collection
    {
        return $this->query()
            ->where('date', '>=', now())
            ->orderBy('date')
            ->limit($count)
            ->get();
    }
}
