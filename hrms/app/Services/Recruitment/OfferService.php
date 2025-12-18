<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\Offer;
use App\Models\OfferTemplate;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Offer Service
 *
 * Handles all business logic for job offer management.
 */
class OfferService extends BaseService
{
    protected string $modelClass = Offer::class;

    protected array $defaultRelations = [
        'jobApplication',
        'jobApplication.candidate',
        'jobApplication.job',
    ];

    protected array $filterableFields = [
        'job_application_id' => 'job_application_id',
        'status' => 'status',
    ];

    /**
     * Get all offers with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new offer.
     */
    public function create(array $data): Offer
    {
        $data['status'] = $data['status'] ?? 'draft';
        $offer = Offer::create($data);

        return $offer->load($this->defaultRelations);
    }

    /**
     * Update an offer.
     */
    public function update(int|Offer $offer, array $data): Offer
    {
        if (is_int($offer)) {
            $offer = $this->findOrFail($offer);
        }

        $offer->update($data);

        return $offer->fresh($this->defaultRelations);
    }

    /**
     * Delete an offer.
     */
    public function delete(int|Offer $offer): bool
    {
        if (is_int($offer)) {
            $offer = $this->findOrFail($offer);
        }

        return $offer->delete();
    }

    /**
     * Send an offer to candidate.
     */
    public function send(int|Offer $offer): Offer
    {
        if (is_int($offer)) {
            $offer = $this->findOrFail($offer);
        }

        $offer->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        return $offer->fresh($this->defaultRelations);
    }

    /**
     * Accept an offer.
     */
    public function accept(int|Offer $offer): Offer
    {
        if (is_int($offer)) {
            $offer = $this->findOrFail($offer);
        }

        $offer->update([
            'status' => 'accepted',
            'responded_at' => now(),
        ]);

        return $offer->fresh($this->defaultRelations);
    }

    /**
     * Reject an offer.
     */
    public function reject(int|Offer $offer, ?string $notes = null): Offer
    {
        if (is_int($offer)) {
            $offer = $this->findOrFail($offer);
        }

        $offer->update([
            'status' => 'rejected',
            'responded_at' => now(),
            'notes' => $notes ?? $offer->notes,
        ]);

        return $offer->fresh($this->defaultRelations);
    }

    /**
     * Withdraw an offer.
     */
    public function withdraw(int|Offer $offer): Offer
    {
        if (is_int($offer)) {
            $offer = $this->findOrFail($offer);
        }

        $offer->update(['status' => 'withdrawn']);

        return $offer->fresh($this->defaultRelations);
    }

    // ========================================
    // OFFER TEMPLATES
    // ========================================

    /**
     * Get all offer templates.
     */
    public function getAllTemplates(): Collection
    {
        return OfferTemplate::orderBy('name')->get();
    }

    /**
     * Create an offer template.
     */
    public function createTemplate(array $data): OfferTemplate
    {
        return OfferTemplate::create($data);
    }

    /**
     * Update an offer template.
     */
    public function updateTemplate(int $id, array $data): OfferTemplate
    {
        $template = OfferTemplate::findOrFail($id);
        $template->update($data);

        return $template->fresh();
    }

    /**
     * Delete an offer template.
     */
    public function deleteTemplate(int $id): bool
    {
        return OfferTemplate::findOrFail($id)->delete();
    }
}
