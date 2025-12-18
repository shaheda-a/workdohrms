<?php

namespace App\Services;

use App\Models\OfficeLocation;
use App\Models\Division;
use App\Models\JobTitle;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Organization Service
 * 
 * Handles business logic for organizational structure:
 * - Office Locations (Branches)
 * - Divisions (Departments)
 * - Job Titles (Designations)
 */
class OrganizationService
{
    // ========================================
    // OFFICE LOCATIONS (BRANCHES)
    // ========================================

    /**
     * Get all office locations.
     */
    public function getAllLocations(array $params = [])
    {
        $query = OfficeLocation::with('divisions');

        if (!empty($params['active_only'])) {
            $query->active();
        }

        if (!empty($params['search'])) {
            $query->where(function ($q) use ($params) {
                $q->where('title', 'like', "%{$params['search']}%")
                  ->orWhere('address', 'like', "%{$params['search']}%");
            });
        }

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? 15;

        return $paginate 
            ? $query->latest()->paginate($perPage) 
            : $query->latest()->get();
    }

    /**
     * Find office location by ID.
     */
    public function findLocation(int $id): ?OfficeLocation
    {
        return OfficeLocation::with('divisions')->find($id);
    }

    /**
     * Create office location.
     */
    public function createLocation(array $data, ?int $authorId = null): OfficeLocation
    {
        if ($authorId) {
            $data['author_id'] = $authorId;
        }
        return OfficeLocation::create($data);
    }

    /**
     * Update office location.
     */
    public function updateLocation(int|OfficeLocation $location, array $data): OfficeLocation
    {
        if (is_int($location)) {
            $location = OfficeLocation::findOrFail($location);
        }
        $location->update($data);
        return $location->fresh();
    }

    /**
     * Delete office location.
     */
    public function deleteLocation(int|OfficeLocation $location): bool
    {
        if (is_int($location)) {
            $location = OfficeLocation::findOrFail($location);
        }
        return $location->delete();
    }

    /**
     * Get locations for dropdown.
     */
    public function getLocationsForDropdown(): Collection
    {
        return OfficeLocation::active()
            ->select('id', 'title')
            ->orderBy('title')
            ->get();
    }

    /**
     * Get location statistics.
     */
    public function getLocationStatistics(): array
    {
        return [
            'total' => OfficeLocation::count(),
            'active' => OfficeLocation::active()->count(),
        ];
    }

    // ========================================
    // DIVISIONS (DEPARTMENTS)
    // ========================================

    /**
     * Get all divisions.
     */
    public function getAllDivisions(array $params = [])
    {
        $query = Division::with('officeLocation');

        if (!empty($params['office_location_id'])) {
            $query->forLocation($params['office_location_id']);
        }

        if (!empty($params['active_only'])) {
            $query->active();
        }

        if (!empty($params['search'])) {
            $query->where('title', 'like', "%{$params['search']}%");
        }

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? 15;

        return $paginate 
            ? $query->latest()->paginate($perPage) 
            : $query->latest()->get();
    }

    /**
     * Find division by ID.
     */
    public function findDivision(int $id): ?Division
    {
        return Division::with(['officeLocation', 'jobTitles'])->find($id);
    }

    /**
     * Create division.
     */
    public function createDivision(array $data, ?int $authorId = null): Division
    {
        if ($authorId) {
            $data['author_id'] = $authorId;
        }
        return Division::create($data);
    }

    /**
     * Update division.
     */
    public function updateDivision(int|Division $division, array $data): Division
    {
        if (is_int($division)) {
            $division = Division::findOrFail($division);
        }
        $division->update($data);
        return $division->fresh('officeLocation');
    }

    /**
     * Delete division.
     */
    public function deleteDivision(int|Division $division): bool
    {
        if (is_int($division)) {
            $division = Division::findOrFail($division);
        }
        return $division->delete();
    }

    /**
     * Get divisions by location.
     */
    public function getDivisionsByLocation(int $locationId): Collection
    {
        return Division::active()
            ->forLocation($locationId)
            ->with('officeLocation')
            ->orderBy('title')
            ->get();
    }

    /**
     * Get divisions for dropdown.
     */
    public function getDivisionsForDropdown(?int $locationId = null): Collection
    {
        $query = Division::active()->select('id', 'title', 'office_location_id');

        if ($locationId) {
            $query->forLocation($locationId);
        }

        return $query->orderBy('title')->get();
    }

    /**
     * Get division statistics.
     */
    public function getDivisionStatistics(): array
    {
        return [
            'total' => Division::count(),
            'active' => Division::active()->count(),
        ];
    }

    // ========================================
    // JOB TITLES (DESIGNATIONS)
    // ========================================

    /**
     * Get all job titles.
     */
    public function getAllJobTitles(array $params = [])
    {
        $query = JobTitle::with('division.officeLocation');

        if (!empty($params['division_id'])) {
            $query->forDivision($params['division_id']);
        }

        if (!empty($params['active_only'])) {
            $query->active();
        }

        if (!empty($params['search'])) {
            $query->where('title', 'like', "%{$params['search']}%");
        }

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? 15;

        return $paginate 
            ? $query->latest()->paginate($perPage) 
            : $query->latest()->get();
    }

    /**
     * Find job title by ID.
     */
    public function findJobTitle(int $id): ?JobTitle
    {
        return JobTitle::with('division.officeLocation')->find($id);
    }

    /**
     * Create job title.
     */
    public function createJobTitle(array $data, ?int $authorId = null): JobTitle
    {
        if ($authorId) {
            $data['author_id'] = $authorId;
        }
        return JobTitle::create($data);
    }

    /**
     * Update job title.
     */
    public function updateJobTitle(int|JobTitle $jobTitle, array $data): JobTitle
    {
        if (is_int($jobTitle)) {
            $jobTitle = JobTitle::findOrFail($jobTitle);
        }
        $jobTitle->update($data);
        return $jobTitle->fresh('division');
    }

    /**
     * Delete job title.
     */
    public function deleteJobTitle(int|JobTitle $jobTitle): bool
    {
        if (is_int($jobTitle)) {
            $jobTitle = JobTitle::findOrFail($jobTitle);
        }
        return $jobTitle->delete();
    }

    /**
     * Get job titles by division.
     */
    public function getJobTitlesByDivision(int $divisionId): Collection
    {
        return JobTitle::active()
            ->forDivision($divisionId)
            ->with('division')
            ->orderBy('title')
            ->get();
    }

    /**
     * Get job titles for dropdown.
     */
    public function getJobTitlesForDropdown(?int $divisionId = null): Collection
    {
        $query = JobTitle::active()->select('id', 'title', 'division_id');

        if ($divisionId) {
            $query->forDivision($divisionId);
        }

        return $query->orderBy('title')->get();
    }

    /**
     * Get job title statistics.
     */
    public function getJobTitleStatistics(): array
    {
        return [
            'total' => JobTitle::count(),
            'active' => JobTitle::active()->count(),
        ];
    }

    // ========================================
    // COMBINED ORGANIZATION DATA
    // ========================================

    /**
     * Get complete organization structure.
     */
    public function getOrganizationStructure(): array
    {
        return [
            'locations' => OfficeLocation::active()
                ->with(['divisions.jobTitles'])
                ->get(),
            'statistics' => [
                'locations' => $this->getLocationStatistics(),
                'divisions' => $this->getDivisionStatistics(),
                'job_titles' => $this->getJobTitleStatistics(),
            ],
        ];
    }

    /**
     * Get organization tree for chart display.
     */
    public function getOrganizationTree(): Collection
    {
        return OfficeLocation::active()
            ->with([
                'divisions' => function ($q) {
                    $q->active()->with([
                        'jobTitles' => function ($q) {
                            $q->active();
                        }
                    ]);
                }
            ])
            ->get();
    }

    /**
     * Get cascading dropdown data (location -> divisions -> job titles).
     */
    public function getCascadingData(): array
    {
        return [
            'locations' => $this->getLocationsForDropdown(),
            'divisions' => Division::active()
                ->select('id', 'title', 'office_location_id')
                ->orderBy('title')
                ->get()
                ->groupBy('office_location_id'),
            'job_titles' => JobTitle::active()
                ->select('id', 'title', 'division_id')
                ->orderBy('title')
                ->get()
                ->groupBy('division_id'),
        ];
    }
}
