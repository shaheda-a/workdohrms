<?php

namespace App\Services\Documents;
use App\Services\Core\BaseService;

use App\Models\GeneratedLetter;
use App\Models\LetterTemplate;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Letter Template Service
 *
 * Handles all business logic for letter template and generated letter management.
 */
class LetterTemplateService extends BaseService
{
    protected string $modelClass = LetterTemplate::class;

    protected array $searchableFields = [
        'name',
        'description',
    ];

    /**
     * Get all letter templates with filtering and pagination.
     */
    public function getAllTemplates(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query();

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['type'])) {
            $query->where('type', $params['type']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a letter template.
     */
    public function createTemplate(array $data): LetterTemplate
    {
        return LetterTemplate::create($data);
    }

    /**
     * Update a letter template.
     */
    public function updateTemplate(int $id, array $data): LetterTemplate
    {
        $template = LetterTemplate::findOrFail($id);
        $template->update($data);

        return $template->fresh();
    }

    /**
     * Delete a letter template.
     */
    public function deleteTemplate(int $id): bool
    {
        return LetterTemplate::findOrFail($id)->delete();
    }

    /**
     * Get templates for dropdown.
     */
    public function getTemplatesForDropdown(?string $type = null): Collection
    {
        $query = LetterTemplate::select(['id', 'name', 'type']);

        if ($type) {
            $query->where('type', $type);
        }

        return $query->orderBy('name')->get();
    }

    // ========================================
    // GENERATED LETTERS
    // ========================================

    /**
     * Get all generated letters.
     */
    public function getAllGeneratedLetters(array $params = []): LengthAwarePaginator|Collection
    {
        $query = GeneratedLetter::with(['template', 'staffMember', 'generatedBy']);

        if (! empty($params['staff_member_id'])) {
            $query->where('staff_member_id', $params['staff_member_id']);
        }

        if (! empty($params['letter_template_id'])) {
            $query->where('letter_template_id', $params['letter_template_id']);
        }

        $query->orderBy('created_at', 'desc');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Generate a letter from template.
     */
    public function generateLetter(int $templateId, int $staffMemberId, int $generatedById): GeneratedLetter
    {
        $template = LetterTemplate::findOrFail($templateId);

        return GeneratedLetter::create([
            'letter_template_id' => $templateId,
            'staff_member_id' => $staffMemberId,
            'generated_by' => $generatedById,
            'content' => $template->content,
        ]);
    }

    /**
     * Update a generated letter.
     */
    public function updateGeneratedLetter(int $id, array $data): GeneratedLetter
    {
        $letter = GeneratedLetter::findOrFail($id);
        $letter->update($data);

        return $letter->fresh(['template', 'staffMember', 'generatedBy']);
    }

    /**
     * Delete a generated letter.
     */
    public function deleteGeneratedLetter(int $id): bool
    {
        return GeneratedLetter::findOrFail($id)->delete();
    }

    /**
     * Get letters by employee.
     */
    public function getLettersByEmployee(int $staffMemberId): Collection
    {
        return GeneratedLetter::with(['template', 'generatedBy'])
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
