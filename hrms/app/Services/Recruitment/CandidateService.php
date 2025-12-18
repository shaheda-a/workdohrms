<?php

namespace App\Services\Recruitment;
use App\Services\Core\BaseService;

use App\Models\Candidate;
use App\Models\StaffMember;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Candidate Service
 *
 * Handles all business logic for candidate management.
 */
class CandidateService extends BaseService
{
    protected string $modelClass = Candidate::class;

    protected array $defaultRelations = [
        'applications',
        'applications.job',
    ];

    protected array $searchableFields = [
        'name',
        'email',
        'phone',
    ];

    protected array $filterableFields = [
        'status' => 'status',
        'source' => 'source',
        'is_archived' => 'is_archived',
    ];

    /**
     * Get all candidates with filtering and pagination.
     */
    public function getAll(array $params = []): LengthAwarePaginator|Collection
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! isset($params['is_archived'])) {
            $query->where('is_archived', false);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new candidate.
     */
    public function create(array $data): Candidate
    {
        return DB::transaction(function () use ($data) {
            $data['status'] = $data['status'] ?? 'new';
            $candidate = Candidate::create($data);

            return $candidate->load($this->defaultRelations);
        });
    }

    /**
     * Update a candidate.
     */
    public function update(int|Candidate $candidate, array $data): Candidate
    {
        if (is_int($candidate)) {
            $candidate = $this->findOrFail($candidate);
        }

        return DB::transaction(function () use ($candidate, $data) {
            $candidate->update($data);

            return $candidate->fresh($this->defaultRelations);
        });
    }

    /**
     * Delete a candidate.
     */
    public function delete(int|Candidate $candidate): bool
    {
        if (is_int($candidate)) {
            $candidate = $this->findOrFail($candidate);
        }

        return $candidate->delete();
    }

    /**
     * Archive a candidate.
     */
    public function archive(int|Candidate $candidate): Candidate
    {
        if (is_int($candidate)) {
            $candidate = $this->findOrFail($candidate);
        }

        $candidate->update(['is_archived' => true]);

        return $candidate->fresh();
    }

    /**
     * Unarchive a candidate.
     */
    public function unarchive(int|Candidate $candidate): Candidate
    {
        if (is_int($candidate)) {
            $candidate = $this->findOrFail($candidate);
        }

        $candidate->update(['is_archived' => false]);

        return $candidate->fresh();
    }

    /**
     * Convert candidate to employee.
     */
    public function convertToEmployee(int|Candidate $candidate, array $employeeData): StaffMember
    {
        if (is_int($candidate)) {
            $candidate = $this->findOrFail($candidate);
        }

        return DB::transaction(function () use ($candidate, $employeeData) {
            // Create user account
            $user = User::create([
                'name' => $candidate->name,
                'email' => $candidate->email,
                'password' => Hash::make($employeeData['password'] ?? 'password123'),
                'is_active' => true,
            ]);

            $user->assignRole('staff_member');

            // Create staff member
            $staffMember = StaffMember::create([
                'user_id' => $user->id,
                'full_name' => $candidate->name,
                'personal_email' => $candidate->email,
                'mobile_number' => $candidate->phone,
                'gender' => $candidate->gender,
                'home_address' => $candidate->address,
                'hire_date' => $employeeData['hire_date'] ?? now(),
                'office_location_id' => $employeeData['office_location_id'] ?? null,
                'division_id' => $employeeData['division_id'] ?? null,
                'job_title_id' => $employeeData['job_title_id'] ?? null,
                'employment_status' => 'active',
            ]);

            // Update candidate status
            $candidate->update(['status' => 'hired']);

            return $staffMember->load(['user', 'officeLocation', 'division', 'jobTitle']);
        });
    }

    /**
     * Get candidate statistics.
     */
    public function getStatistics(): array
    {
        return [
            'total' => Candidate::count(),
            'active' => Candidate::where('is_archived', false)->count(),
            'archived' => Candidate::where('is_archived', true)->count(),
            'by_status' => Candidate::selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
        ];
    }
}
