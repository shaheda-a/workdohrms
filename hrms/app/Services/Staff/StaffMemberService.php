<?php

namespace App\Services\Staff;
use App\Services\Core\BaseService;

use App\Models\StaffMember;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Staff Member Service
 *
 * Handles all business logic related to staff members/employees.
 */
class StaffMemberService extends BaseService
{
    protected string $modelClass = StaffMember::class;

    protected array $defaultRelations = [
        'user',
        'officeLocation',
        'division',
        'jobTitle',
    ];

    protected array $searchableFields = [
        'full_name',
        'staff_code',
        'personal_email',
        'mobile_number',
    ];

    protected array $filterableFields = [
        'office_location_id' => 'office_location_id',
        'division_id' => 'division_id',
        'job_title_id' => 'job_title_id',
        'employment_status' => 'status',
        'gender' => 'gender',
    ];

    /**
     * Get all staff members with extended relations.
     */
    public function getAllWithDetails(array $params = [])
    {
        $query = $this->query()->with([
            'user',
            'officeLocation',
            'division',
            'jobTitle',
            'files.fileCategory',
        ]);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new staff member with associated user account.
     */
    public function createWithUser(array $data, ?int $authorId = null): StaffMember
    {
        return DB::transaction(function () use ($data, $authorId) {
            // Create user account
            $user = User::create([
                'name' => $data['full_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? 'password123'),
                'is_active' => true,
            ]);
            $user->assignRole('staff_member');

            // Prepare staff member data
            $staffData = collect($data)->except(['email', 'password'])->toArray();
            $staffData['user_id'] = $user->id;

            if ($authorId) {
                $staffData['author_id'] = $authorId;
            }

            return StaffMember::create($staffData);
        });
    }

    /**
     * Update staff member and associated user.
     */
    public function updateWithUser(int|StaffMember $staffMember, array $data): StaffMember
    {
        if (is_int($staffMember)) {
            $staffMember = $this->findOrFail($staffMember);
        }

        return DB::transaction(function () use ($staffMember, $data) {
            $staffMember->update($data);

            // Update linked user name if full_name changed
            if (isset($data['full_name']) && $staffMember->user) {
                $staffMember->user->update(['name' => $data['full_name']]);
            }

            return $staffMember->fresh($this->defaultRelations);
        });
    }

    /**
     * Deactivate a staff member (soft delete).
     */
    public function deactivate(int|StaffMember $staffMember): bool
    {
        if (is_int($staffMember)) {
            $staffMember = $this->findOrFail($staffMember);
        }

        return DB::transaction(function () use ($staffMember) {
            if ($staffMember->user) {
                $staffMember->user->update(['is_active' => false]);
            }
            $staffMember->update(['employment_status' => 'terminated']);

            return $staffMember->delete();
        });
    }

    /**
     * Get staff member with full details for profile view.
     */
    public function getFullProfile(int $id): StaffMember
    {
        return $this->findOrFail($id, [
            'user',
            'officeLocation',
            'division',
            'jobTitle',
            'files.fileCategory',
            'recognitionRecords.category',
            'roleUpgrades.newJobTitle',
            'disciplineNotes',
            'businessTrips',
            'voluntaryExits',
        ]);
    }

    /**
     * Get staff members for dropdown/select.
     */
    public function getForDropdown(array $params = [], array $fields = ['id', 'full_name']): Collection
    {
        $query = StaffMember::active()->select(['id', 'full_name', 'staff_code']);

        if (! empty($params['office_location_id'])) {
            $query->forLocation($params['office_location_id']);
        }
        if (! empty($params['division_id'])) {
            $query->forDivision($params['division_id']);
        }

        return $query->orderBy('full_name')->get();
    }

    /**
     * Get active staff count.
     */
    public function getActiveCount(): int
    {
        return StaffMember::active()->count();
    }

    /**
     * Get staff by employment status.
     */
    public function getByStatus(string $status)
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('employment_status', $status)
            ->latest()
            ->get();
    }

    /**
     * Get staff members by office location.
     */
    public function getByLocation(int $locationId)
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->forLocation($locationId)
            ->latest()
            ->get();
    }

    /**
     * Get staff members by division.
     */
    public function getByDivision(int $divisionId)
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->forDivision($divisionId)
            ->latest()
            ->get();
    }

    /**
     * Update employment status.
     */
    public function updateStatus(int|StaffMember $staffMember, string $status): StaffMember
    {
        if (is_int($staffMember)) {
            $staffMember = $this->findOrFail($staffMember);
        }

        $staffMember->update(['employment_status' => $status]);

        return $staffMember->fresh();
    }

    /**
     * Get recently hired employees.
     */
    public function getRecentHires(int $days = 30)
    {
        return $this->query()
            ->with($this->defaultRelations)
            ->where('hire_date', '>=', now()->subDays($days))
            ->latest('hire_date')
            ->get();
    }

    /**
     * Get employees with upcoming birthdays.
     */
    public function getUpcomingBirthdays(int $days = 30)
    {
        $today = now();
        $futureDate = now()->addDays($days);

        return $this->query()
            ->whereNotNull('birth_date')
            ->whereRaw("DATE_FORMAT(birth_date, '%m-%d') >= ?", [$today->format('m-d')])
            ->whereRaw("DATE_FORMAT(birth_date, '%m-%d') <= ?", [$futureDate->format('m-d')])
            ->orderByRaw("DATE_FORMAT(birth_date, '%m-%d')")
            ->get();
    }

    /**
     * Get staff statistics.
     */
    public function getStatistics(): array
    {
        $total = StaffMember::count();
        $active = StaffMember::active()->count();
        $onLeave = StaffMember::where('employment_status', 'on_leave')->count();
        $newThisMonth = StaffMember::whereMonth('hire_date', now()->month)
            ->whereYear('hire_date', now()->year)
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'on_leave' => $onLeave,
            'inactive' => $total - $active,
            'new_this_month' => $newThisMonth,
        ];
    }

    /**
     * Search staff members.
     */
    public function search(string $term, int $limit = 10)
    {
        return $this->query()
            ->with(['division', 'jobTitle'])
            ->where(function ($q) use ($term) {
                $q->where('full_name', 'like', "%{$term}%")
                    ->orWhere('staff_code', 'like', "%{$term}%")
                    ->orWhere('personal_email', 'like', "%{$term}%");
            })
            ->active()
            ->limit($limit)
            ->get();
    }
}
