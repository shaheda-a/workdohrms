<?php

namespace App\Services\Organization;
use App\Services\Core\BaseService;

use App\Models\OrganizationDocument;
use App\Models\OrganizationPolicy;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Organization Policy Service
 *
 * Handles all business logic for organization policy and document management.
 */
class OrganizationPolicyService extends BaseService
{
    protected string $modelClass = OrganizationPolicy::class;

    protected array $searchableFields = [
        'title',
        'description',
    ];

    /**
     * Get all organization policies with filtering and pagination.
     */
    public function getAllPolicies(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query();

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['category'])) {
            $query->where('category', $params['category']);
        }

        if (isset($params['is_published'])) {
            $query->where('is_published', $params['is_published']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an organization policy.
     */
    public function createPolicy(array $data): OrganizationPolicy
    {
        return OrganizationPolicy::create($data);
    }

    /**
     * Update an organization policy.
     */
    public function updatePolicy(int $id, array $data): OrganizationPolicy
    {
        $policy = OrganizationPolicy::findOrFail($id);
        $policy->update($data);

        return $policy->fresh();
    }

    /**
     * Delete an organization policy.
     */
    public function deletePolicy(int $id): bool
    {
        return OrganizationPolicy::findOrFail($id)->delete();
    }

    /**
     * Publish a policy.
     */
    public function publishPolicy(int $id): OrganizationPolicy
    {
        $policy = OrganizationPolicy::findOrFail($id);
        $policy->update([
            'is_published' => true,
            'published_at' => now(),
        ]);

        return $policy->fresh();
    }

    /**
     * Unpublish a policy.
     */
    public function unpublishPolicy(int $id): OrganizationPolicy
    {
        $policy = OrganizationPolicy::findOrFail($id);
        $policy->update(['is_published' => false]);

        return $policy->fresh();
    }

    /**
     * Get published policies.
     */
    public function getPublishedPolicies(): Collection
    {
        return $this->query()
            ->where('is_published', true)
            ->orderBy('title')
            ->get();
    }

    // ========================================
    // ORGANIZATION DOCUMENTS
    // ========================================

    /**
     * Get all organization documents.
     */
    public function getAllDocuments(array $params = []): LengthAwarePaginator|Collection
    {
        $query = OrganizationDocument::with(['uploadedBy']);

        if (! empty($params['category'])) {
            $query->where('category', $params['category']);
        }

        $query->orderBy('created_at', 'desc');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create an organization document.
     */
    public function createDocument(array $data): OrganizationDocument
    {
        return OrganizationDocument::create($data);
    }

    /**
     * Update an organization document.
     */
    public function updateDocument(int $id, array $data): OrganizationDocument
    {
        $document = OrganizationDocument::findOrFail($id);
        $document->update($data);

        return $document->fresh(['uploadedBy']);
    }

    /**
     * Delete an organization document.
     */
    public function deleteDocument(int $id): bool
    {
        $document = OrganizationDocument::findOrFail($id);

        if ($document->file_path) {
            Storage::delete($document->file_path);
        }

        return $document->delete();
    }
}
