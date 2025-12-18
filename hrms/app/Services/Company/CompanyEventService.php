<?php

namespace App\Services\Company;
use App\Services\Core\BaseService;

use App\Models\CompanyEvent;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Company Event Service
 *
 * Handles all business logic for company event management.
 */
class CompanyEventService extends BaseService
{
    protected string $modelClass = CompanyEvent::class;

    protected array $defaultRelations = [];

    protected array $searchableFields = [
        'title',
        'description',
    ];

    protected array $filterableFields = [
        'event_type' => 'event_type',
    ];

    /**
     * Get all events with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query();

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('event_date', [$params['start_date'], $params['end_date']]);
        }

        if (! empty($params['month']) && ! empty($params['year'])) {
            $query->whereMonth('event_date', $params['month'])
                ->whereYear('event_date', $params['year']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new event.
     */
    public function create(array $data): CompanyEvent
    {
        return CompanyEvent::create($data);
    }

    /**
     * Update an event.
     */
    public function update(int|CompanyEvent $event, array $data): CompanyEvent
    {
        if (is_int($event)) {
            $event = $this->findOrFail($event);
        }

        $event->update($data);

        return $event->fresh();
    }

    /**
     * Delete an event.
     */
    public function delete(int|CompanyEvent $event): bool
    {
        if (is_int($event)) {
            $event = $this->findOrFail($event);
        }

        return $event->delete();
    }

    /**
     * Get upcoming events.
     */
    public function getUpcoming(int $days = 30): Collection
    {
        return $this->query()
            ->where('event_date', '>=', now())
            ->where('event_date', '<=', now()->addDays($days))
            ->orderBy('event_date')
            ->get();
    }

    /**
     * Get events for calendar.
     */
    public function getForCalendar(int $month, int $year): Collection
    {
        return $this->query()
            ->whereMonth('event_date', $month)
            ->whereYear('event_date', $year)
            ->orderBy('event_date')
            ->get();
    }
}
