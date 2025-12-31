<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLocation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Exception;

class DocumentService
{
    /**
     * UNIFIED UPLOAD: Automatically detects storage location based on org/company
     * Single API endpoint for all uploads
     */
    public function uploadDocument(UploadedFile $file, array $data): Document
    {
        // 1. Determine storage location based on org_id or company_id
        $location = $this->determineStorageLocation($data);

        if (!$location) {
            throw new Exception('No storage location configured for this organization/company');
        }

        // 2. Get storage type name for logging
        $storageTypeName = $this->getStorageTypeName($location->location_type);

        // 3. Configure Dynamic Disk
        $diskName = $this->configureDisk($location);

        // 4. Generate Path
        $ownerType = $data['owner_type'];
        $ownerId = $data['owner_id'];
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        $path = "{$ownerType}/{$ownerId}/" . date('Y');
        $fullPath = $path . '/' . $filename;

        // 5. Upload File
        try {
            $stream = fopen($file->getRealPath(), 'r');
            if ($stream === false) {
                throw new Exception('Unable to open file stream');
            }

            Storage::disk($diskName)->writeStream(
                $fullPath,
                $stream,
                ['visibility' => 'private']
            );

            if (is_resource($stream)) {
                fclose($stream);
            }

            \Log::info("Document uploaded successfully", [
                'storage' => $storageTypeName,
                'path' => $fullPath,
                'file' => $file->getClientOriginalName()
            ]);

        } catch (\Aws\S3\Exception\S3Exception $e) {
            $awsError = $e->getAwsErrorMessage() ?? $e->getMessage();
            $awsCode = $e->getAwsErrorCode() ?? 'Unknown';

            \Log::error("Cloud Storage Upload Error [{$storageTypeName}]", [
                'error_code' => $awsCode,
                'error_message' => $awsError,
                'status_code' => $e->getStatusCode(),
                'file' => $file->getClientOriginalName(),
                'path' => $fullPath,
            ]);

            throw new Exception("Cloud Storage Error [{$awsCode}]: {$awsError}");

        } catch (\Exception $e) {
            \Log::error("Document Upload Error [{$storageTypeName}]: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $file->getClientOriginalName(),
                'location_type' => $location->location_type,
                'disk' => $diskName,
                'path' => $fullPath
            ]);

            $detailedError = $e->getPrevious() ? $e->getPrevious()->getMessage() : $e->getMessage();
            throw new Exception("Storage Error: " . $detailedError);
        }

        // 6. Save Metadata to Database
        return Document::create([
            'document_type_id' => $data['document_type_id'],
            'document_location_id' => $location->id,
            'org_id' => $data['org_id'] ?? null,
            'company_id' => $data['company_id'] ?? null,
            'user_id' => auth()->id(),
            'owner_type' => $ownerType,
            'owner_id' => $ownerId,
            'doc_url' => $fullPath,
            'document_name' => $data['document_name'] ?? $file->getClientOriginalName(),
            'document_size' => $file->getSize(),
            'document_extension' => $extension,
            'mime_type' => $file->getMimeType(),
        ]);
    }

    /**
     * Determine storage location based on org_id or company_id
     * Priority:
     * 1. Exact match (both org_id AND company_id)
     * 2. company_id only
     * 3. org_id only
     * 4. Global/Default (both null)
     * 5. Fallback to local
     */
    protected function determineStorageLocation(array $data): ?DocumentLocation
    {
        $orgId = $data['org_id'] ?? null;
        $companyId = $data['company_id'] ?? null;

        // Priority 1: EXACT MATCH - Both org_id AND company_id
        if ($orgId && $companyId) {
            $location = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig'])
                ->where('org_id', $orgId)
                ->where('company_id', $companyId)
                ->first();

            if ($location) {
                \Log::info("Storage location: Exact match (org={$orgId}, company={$companyId})", [
                    'location_id' => $location->id,
                    'location_type' => $location->location_type
                ]);
                return $location;
            }
        }

        // Priority 2: Match by company_id only
        if ($companyId) {
            $location = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig'])
                ->where('company_id', $companyId)
                ->whereNull('org_id')
                ->first();

            if ($location) {
                \Log::info("Storage location: company_id={$companyId}", [
                    'location_id' => $location->id,
                    'location_type' => $location->location_type
                ]);
                return $location;
            }
        }

        // Priority 3: Match by org_id only
        if ($orgId) {
            $location = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig'])
                ->where('org_id', $orgId)
                ->whereNull('company_id')
                ->first();

            if ($location) {
                \Log::info("Storage location: org_id={$orgId}", [
                    'location_id' => $location->id,
                    'location_type' => $location->location_type
                ]);
                return $location;
            }
        }

        // Priority 4: Global/Default location (both null)
        $location = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig'])
            ->whereNull('org_id')
            ->whereNull('company_id')
            ->first();

        if ($location) {
            \Log::info("Storage location: Global default", [
                'location_id' => $location->id,
                'location_type' => $location->location_type
            ]);
            return $location;
        }

        // Priority 5: Fallback to any local storage
        \Log::warning("No specific storage found, falling back to local");
        return DocumentLocation::where('location_type', 1)->first();
    }

    /**
     * Get storage type name from location_type ID (public for controller access)
     */
    public function getStorageTypeName(int $locationType): string
    {
        return match ($locationType) {
            1 => 'local',
            2 => 'wasabi',
            3 => 'aws',
            default => 'unknown'
        };
    }

    /**
     * Configure Dynamic Disk based on location type
     */
    protected function configureDisk(DocumentLocation $location): string
    {
        $storageType = $this->getStorageTypeName($location->location_type);
        $diskName = 'dynamic_disk_' . $storageType . '_' . $location->id;

        // Local Storage
        if ($location->location_type === 1) {
            return 'public';
        }

        // Wasabi Storage
        if ($location->location_type === 2) {
            $config = $location->wasabiConfig;
            if (!$config) {
                throw new Exception("Wasabi configuration missing for location ID: {$location->id}");
            }

            $wasabiEndpoint = "https://s3.{$config->region}.wasabisys.com";

            Config::set("filesystems.disks.{$diskName}", [
                'driver' => 's3',
                'key' => $config->access_key,
                'secret' => $config->secret_key,
                'region' => $config->region,
                'bucket' => $config->bucket,
                'endpoint' => $wasabiEndpoint,
                'use_path_style_endpoint' => false,
                'throw' => true,
            ]);

            return $diskName;
        }

        // AWS S3 Storage
        if ($location->location_type === 3) {
            $config = $location->awsConfig;
            if (!$config) {
                throw new Exception("AWS configuration missing for location ID: {$location->id}");
            }

            Config::set("filesystems.disks.{$diskName}", [
                'driver' => 's3',
                'key' => $config->access_key,
                'secret' => $config->secret_key,
                'region' => $config->region,
                'bucket' => $config->bucket,
                'throw' => true,
            ]);

            return $diskName;
        }

        // Fallback to public
        return 'public';
    }

    /**
     * Get Document Logic with Tenant Filtering
     */
    public function getDocument(int $id, array $filters = []): ?Document
    {
        $query = Document::with(['location', 'type', 'uploader', 'organization', 'company'])
            ->where('id', $id);

        // Filter by org_id
        if (isset($filters['org_id'])) {
            $query->where('org_id', $filters['org_id']);
        }

        // Filter by company_id
        if (isset($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        return $query->first();
    }

    /**
     * Get All Documents Logic with Filters and Pagination
     */
    public function getAllDocuments(array $filters = [], int $perPage = 15)
    {
        $query = Document::with(['location', 'type', 'uploader', 'organization', 'company']);

        // Filter by org_id (REQUIRED)
        if (isset($filters['org_id'])) {
            $query->where('org_id', $filters['org_id']);
        }

        // Filter by company_id (REQUIRED)
        if (isset($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        // Filter by owner_type
        if (isset($filters['owner_type'])) {
            $query->where('owner_type', $filters['owner_type']);
        }

        // Filter by owner_id
        if (isset($filters['owner_id'])) {
            $query->where('owner_id', $filters['owner_id']);
        }

        // Filter by document_type_id
        if (isset($filters['document_type_id'])) {
            $query->where('document_type_id', $filters['document_type_id']);
        }

        // Filter by location_type
        if (isset($filters['location_type'])) {
            $query->whereHas('location', function ($q) use ($filters) {
                $q->where('location_type', $filters['location_type']);
            });
        }

        // Search in document_name
        if (isset($filters['search']) && !empty($filters['search'])) {
            $query->where('document_name', 'like', '%' . $filters['search'] . '%');
        }

        // Filter by date range
        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Return paginated or all
        if ($perPage > 0) {
            return $query->paginate($perPage);
        }

        return $query->get();
    }

    /**
     * Update Document Metadata with Tenant Filtering
     */
    public function updateDocumentMetadata(int $id, array $data, array $filters = []): Document
    {
        $query = Document::where('id', $id);

        // Filter by org_id
        if (isset($filters['org_id'])) {
            $query->where('org_id', $filters['org_id']);
        }

        // Filter by company_id
        if (isset($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        $document = $query->firstOrFail();

        $document->update([
            'document_name' => $data['document_name'] ?? $document->document_name,
            'document_type_id' => $data['document_type_id'] ?? $document->document_type_id,
        ]);

        return $document;
    }

    /**
     * Delete Document with Tenant Filtering
     */
    public function deleteDocument(int $id, array $filters = []): bool
    {
        $query = Document::where('id', $id);

        // Filter by org_id
        if (isset($filters['org_id'])) {
            $query->where('org_id', $filters['org_id']);
        }

        // Filter by company_id
        if (isset($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        $document = $query->firstOrFail();
        $location = $document->location;

        // Configure disk to delete file
        $diskName = $this->configureDisk($location);

        if (Storage::disk($diskName)->exists($document->doc_url)) {
            Storage::disk($diskName)->delete($document->doc_url);
        }

        return $document->delete();
    }

    /**
     * Get View/Download URL
     */
    public function getDocumentUrl(Document $document): string
    {
        $location = $document->location;
        $diskName = $this->configureDisk($location);

        if ($location->location_type === 1) { // Local
            // Generate proper URL with APP_URL
            $appUrl = config('app.url', 'http://127.0.0.1:8000');
            return rtrim($appUrl, '/') . '/storage/' . $document->doc_url;
        }

        // S3/Wasabi Presigned URL (60 minutes)
        return Storage::disk($diskName)->temporaryUrl(
            $document->doc_url,
            now()->addMinutes(60)
        );
    }

    /**
     * Download Document (stream response)
     */
    public function downloadDocument(Document $document)
    {
        $location = $document->location;
        $diskName = $this->configureDisk($location);

        if (!Storage::disk($diskName)->exists($document->doc_url)) {
            throw new Exception('File not found in storage');
        }

        $fileContents = Storage::disk($diskName)->get($document->doc_url);

        return response($fileContents, 200)
            ->header('Content-Type', $document->mime_type)
            ->header('Content-Disposition', 'attachment; filename="' . $document->document_name . '"');
    }
}
