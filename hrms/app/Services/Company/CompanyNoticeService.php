<?php

namespace App\Services\Company;
use App\Services\Core\BaseService;

use App\Models\CompanyNotice;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Company Notice Service
 *
 * Handles all business logic for company notice/announcement management.
 */
class CompanyNoticeService extends BaseService
{
    protected string $modelClass = CompanyNotice::class;

    protected array $defaultRelations = [
        'author',
    ];

    protected array $searchableFields = [
        'title',
        'content',
    ];

    /**
     * Get all notices with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['is_published'])) {
            $query->where('is_published', true);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new notice.
     */
    public function create(array $data, ?int $authorId = null): CompanyNotice
    {
        $data['author_id'] = $authorId ?? $data['author_id'] ?? null;
        $notice = CompanyNotice::create($data);

        return $notice->load($this->defaultRelations);
    }

    /**
     * Update a notice.
     */
    public function update(int|CompanyNotice $notice, array $data): CompanyNotice
    {
        if (is_int($notice)) {
            $notice = $this->findOrFail($notice);
        }

        $notice->update($data);

        return $notice->fresh($this->defaultRelations);
    }

    /**
     * Delete a notice.
     */
    public function delete(int|CompanyNotice $notice): bool
    {
        if (is_int($notice)) {
            $notice = $this->findOrFail($notice);
        }

        return $notice->delete();
    }

    /**
     * Publish a notice.
     */
    public function publish(int|CompanyNotice $notice): CompanyNotice
    {
        if (is_int($notice)) {
            $notice = $this->findOrFail($notice);
        }

        $notice->update([
            'is_published' => true,
            'published_at' => now(),
        ]);

        return $notice->fresh($this->defaultRelations);
    }

    /**
     * Unpublish a notice.
     */
    public function unpublish(int|CompanyNotice $notice): CompanyNotice
    {
        if (is_int($notice)) {
            $notice = $this->findOrFail($notice);
        }

        $notice->update(['is_published' => false]);

        return $notice->fresh($this->defaultRelations);
    }

    /**
     * Get published notices.
     */
    public function getPublished(int $limit = 10): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('is_published', true)
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
