<?php

namespace App\Services\Attendance;
use App\Services\Core\BaseService;

use App\Models\Timesheet;
use App\Models\TimesheetEntry;
use App\Models\TimesheetProject;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Timesheet Service
 *
 * Handles all business logic for timesheet management.
 */
class TimesheetService extends BaseService
{
    protected string $modelClass = Timesheet::class;

    protected array $defaultRelations = [
        'staffMember',
        'entries.project',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'status' => 'status',
    ];

    /**
     * Get all timesheets with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['week_start'])) {
            $query->where('week_start', $params['week_start']);
        }

        if (! empty($params['start_date']) && ! empty($params['end_date'])) {
            $query->whereBetween('week_start', [$params['start_date'], $params['end_date']]);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a timesheet.
     */
    public function create(array $data): Timesheet
    {
        return DB::transaction(function () use ($data) {
            $data['status'] = $data['status'] ?? 'draft';
            $timesheet = Timesheet::create($data);

            if (! empty($data['entries'])) {
                foreach ($data['entries'] as $entry) {
                    TimesheetEntry::create([
                        'timesheet_id' => $timesheet->id,
                        'project_id' => $entry['project_id'],
                        'date' => $entry['date'],
                        'hours' => $entry['hours'],
                        'description' => $entry['description'] ?? null,
                    ]);
                }
            }

            return $timesheet->load($this->defaultRelations);
        });
    }

    /**
     * Update a timesheet.
     */
    public function update(int|Timesheet $timesheet, array $data): Timesheet
    {
        if (is_int($timesheet)) {
            $timesheet = $this->findOrFail($timesheet);
        }

        return DB::transaction(function () use ($timesheet, $data) {
            $timesheet->update($data);

            if (isset($data['entries'])) {
                $timesheet->entries()->delete();
                foreach ($data['entries'] as $entry) {
                    TimesheetEntry::create([
                        'timesheet_id' => $timesheet->id,
                        'project_id' => $entry['project_id'],
                        'date' => $entry['date'],
                        'hours' => $entry['hours'],
                        'description' => $entry['description'] ?? null,
                    ]);
                }
            }

            return $timesheet->fresh($this->defaultRelations);
        });
    }

    /**
     * Delete a timesheet.
     */
    public function delete(int|Timesheet $timesheet): bool
    {
        if (is_int($timesheet)) {
            $timesheet = $this->findOrFail($timesheet);
        }

        return $timesheet->delete();
    }

    /**
     * Submit a timesheet for approval.
     */
    public function submit(int|Timesheet $timesheet): Timesheet
    {
        if (is_int($timesheet)) {
            $timesheet = $this->findOrFail($timesheet);
        }

        $timesheet->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return $timesheet->fresh($this->defaultRelations);
    }

    /**
     * Approve a timesheet.
     */
    public function approve(int|Timesheet $timesheet, int $approvedById): Timesheet
    {
        if (is_int($timesheet)) {
            $timesheet = $this->findOrFail($timesheet);
        }

        $timesheet->update([
            'status' => 'approved',
            'approved_by' => $approvedById,
            'approved_at' => now(),
        ]);

        return $timesheet->fresh($this->defaultRelations);
    }

    /**
     * Reject a timesheet.
     */
    public function reject(int|Timesheet $timesheet, ?string $reason = null): Timesheet
    {
        if (is_int($timesheet)) {
            $timesheet = $this->findOrFail($timesheet);
        }

        $timesheet->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $timesheet->fresh($this->defaultRelations);
    }

    /**
     * Get timesheets by employee.
     */
    public function getByEmployee(int $staffMemberId): Collection
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderBy('week_start', 'desc')
            ->get();
    }

    // ========================================
    // TIMESHEET PROJECTS
    // ========================================

    /**
     * Get all timesheet projects.
     */
    public function getAllProjects(): Collection
    {
        return TimesheetProject::orderBy('name')->get();
    }

    /**
     * Create a timesheet project.
     */
    public function createProject(array $data): TimesheetProject
    {
        return TimesheetProject::create($data);
    }

    /**
     * Update a timesheet project.
     */
    public function updateProject(int $id, array $data): TimesheetProject
    {
        $project = TimesheetProject::findOrFail($id);
        $project->update($data);

        return $project->fresh();
    }

    /**
     * Delete a timesheet project.
     */
    public function deleteProject(int $id): bool
    {
        return TimesheetProject::findOrFail($id)->delete();
    }

    /**
     * Get projects for dropdown.
     */
    public function getProjectsForDropdown(): Collection
    {
        return TimesheetProject::select(['id', 'name'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }
}
