<?php

namespace App\Services;

use App\Models\DocumentType;
use App\Enums\DocumentOwnerType;
use Exception;
use Illuminate\Database\Eloquent\Collection;

class DocumentTypeService
{
    /**
     * Get all document types with pagination, search, and ordering
     */
    public function getAllDocumentTypes(array $params = [])
    {
        $query = DocumentType::query();

        // Search support
        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where('title', 'like', "%{$search}%");
        }

        // Sorting support
        if (!empty($params['order_by'])) {
            $direction = $params['order'] ?? 'asc';
            $query->orderBy($params['order_by'], $direction);
        } else {
            $query->latest();
        }

        $perPage = $params['per_page'] ?? 15;
        return $query->paginate($perPage);
    }

    /**
     * Create a new document type
     */
    public function createDocumentType(array $data): DocumentType
    {
        // Extract Enum ID if passed, or raw integer
        $ownerTypeId = null;
        if (isset($data['owner_type'])) {
             // If incoming data is arguably the Enum value (string), map to ID
             // Or if it's the integer ID directly
             // Assuming controller validation passes the Enum string usually, we should convert:
             $enum = DocumentOwnerType::tryFrom($data['owner_type']);
             if ($enum) {
                 $ownerTypeId = $enum->id();
             } else {
                 // Might be coming in as integer directly
                 $ownerTypeId = $data['owner_type']; 
             }
        }

        return DocumentType::create([
            'title' => $data['title'],
            'notes' => $data['notes'] ?? null,
            'owner_type_id' => $ownerTypeId, 
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    /**
     * Get single document type
     */
    public function getDocumentType(int $id): ?DocumentType
    {
        return DocumentType::find($id);
    }

    /**
     * Update document type
     */
    public function updateDocumentType(int $id, array $data): DocumentType
    {
        $documentType = DocumentType::findOrFail($id);
        
        $ownerTypeId = $documentType->owner_type_id;
        if (isset($data['owner_type'])) {
             $enum = DocumentOwnerType::tryFrom($data['owner_type']);
             if ($enum) {
                 $ownerTypeId = $enum->id();
             } else {
                 $ownerTypeId = $data['owner_type'];
             }
        }

        $documentType->update([
            'title' => $data['title'] ?? $documentType->title,
            'notes' => $data['notes'] ?? $documentType->notes,
            'owner_type_id' => $ownerTypeId,
            'is_active' => $data['is_active'] ?? $documentType->is_active,
        ]);

        return $documentType;
    }

    /**
     * Delete document type
     */
    public function deleteDocumentType(int $id): bool
    {
        $documentType = DocumentType::findOrFail($id);
        return $documentType->delete();
    }
}
