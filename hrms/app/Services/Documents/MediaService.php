<?php

namespace App\Services\Documents;
use App\Services\Core\BaseService;

use App\Models\MediaDirectory;
use App\Models\MediaFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Media Service
 *
 * Handles all business logic for media file and directory management.
 */
class MediaService extends BaseService
{
    protected string $modelClass = MediaFile::class;

    protected array $defaultRelations = [
        'directory',
        'uploadedBy',
    ];

    protected array $searchableFields = [
        'name',
        'original_name',
    ];

    protected array $filterableFields = [
        'media_directory_id' => 'directory_id',
        'file_type' => 'file_type',
    ];

    /**
     * Get all media files with filtering and pagination.
     */
    public function getAllFiles(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a media file record.
     */
    public function createFile(array $data): MediaFile
    {
        $file = MediaFile::create($data);

        return $file->load($this->defaultRelations);
    }

    /**
     * Update a media file.
     */
    public function updateFile(int $id, array $data): MediaFile
    {
        $file = MediaFile::findOrFail($id);
        $file->update($data);

        return $file->fresh($this->defaultRelations);
    }

    /**
     * Delete a media file.
     */
    public function deleteFile(int $id): bool
    {
        $file = MediaFile::findOrFail($id);

        if ($file->path) {
            Storage::delete($file->path);
        }

        return $file->delete();
    }

    /**
     * Get files by directory.
     */
    public function getFilesByDirectory(int $directoryId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('media_directory_id', $directoryId)
            ->orderBy('name')
            ->get();
    }

    // ========================================
    // MEDIA DIRECTORIES
    // ========================================

    /**
     * Get all directories.
     */
    public function getAllDirectories(array $params = []): LengthAwarePaginator|Collection
    {
        $query = MediaDirectory::with(['parent', 'children']);

        if (! empty($params['parent_id'])) {
            $query->where('parent_id', $params['parent_id']);
        } else {
            $query->whereNull('parent_id');
        }

        $query->orderBy('name');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a directory.
     */
    public function createDirectory(array $data): MediaDirectory
    {
        return MediaDirectory::create($data);
    }

    /**
     * Update a directory.
     */
    public function updateDirectory(int $id, array $data): MediaDirectory
    {
        $directory = MediaDirectory::findOrFail($id);
        $directory->update($data);

        return $directory->fresh(['parent', 'children']);
    }

    /**
     * Delete a directory.
     */
    public function deleteDirectory(int $id): bool
    {
        $directory = MediaDirectory::findOrFail($id);

        $directory->files()->each(function ($file) {
            if ($file->path) {
                Storage::delete($file->path);
            }
            $file->delete();
        });

        return $directory->delete();
    }

    /**
     * Get directory tree.
     */
    public function getDirectoryTree(): Collection
    {
        return MediaDirectory::with(['children' => function ($query) {
            $query->with('children');
        }])
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();
    }
}
