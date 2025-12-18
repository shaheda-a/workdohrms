<?php

namespace App\Services\Auth;
use App\Services\Core\BaseService;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * User Service
 *
 * Handles all business logic for user management including roles and permissions.
 */
class UserService extends BaseService
{
    protected string $modelClass = User::class;

    protected array $defaultRelations = [
        'roles',
        'permissions',
    ];

    protected array $searchableFields = [
        'name',
        'email',
    ];

    protected array $filterableFields = [
        'is_active' => 'is_active',
    ];

    /**
     * Get all users with roles.
     */
    public function getAllUsers(array $params = [])
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (! empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        if (! empty($params['role'])) {
            $query->role($params['role']);
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a new user.
     */
    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? 'password'),
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (! empty($data['role'])) {
                $user->assignRole($data['role']);
            }

            if (! empty($data['permissions'])) {
                $user->givePermissionTo($data['permissions']);
            }

            return $user->load($this->defaultRelations);
        });
    }

    /**
     * Update user.
     */
    public function updateUser(int|User $user, array $data): User
    {
        if (is_int($user)) {
            $user = $this->findOrFail($user);
        }

        return DB::transaction(function () use ($user, $data) {
            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $user->update(collect($data)->only(['name', 'email', 'password', 'is_active'])->toArray());

            if (isset($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            if (isset($data['permissions'])) {
                $user->syncPermissions($data['permissions']);
            }

            return $user->fresh($this->defaultRelations);
        });
    }

    /**
     * Deactivate user.
     */
    public function deactivateUser(int|User $user): User
    {
        if (is_int($user)) {
            $user = $this->findOrFail($user);
        }

        $user->update(['is_active' => false]);

        return $user->fresh();
    }

    /**
     * Activate user.
     */
    public function activateUser(int|User $user): User
    {
        if (is_int($user)) {
            $user = $this->findOrFail($user);
        }

        $user->update(['is_active' => true]);

        return $user->fresh();
    }

    // ========================================
    // ROLES MANAGEMENT
    // ========================================

    /**
     * Get all roles.
     */
    public function getAllRoles(): Collection
    {
        return Role::with('permissions')->orderBy('name')->get();
    }

    /**
     * Create a role.
     */
    public function createRole(array $data): Role
    {
        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => 'web',
        ]);

        if (! empty($data['permissions'])) {
            $role->givePermissionTo($data['permissions']);
        }

        return $role->load('permissions');
    }

    /**
     * Update role.
     */
    public function updateRole(int $roleId, array $data): Role
    {
        $role = Role::findOrFail($roleId);

        if (isset($data['name'])) {
            $role->update(['name' => $data['name']]);
        }

        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return $role->fresh('permissions');
    }

    /**
     * Delete role.
     */
    public function deleteRole(int $roleId): bool
    {
        return Role::findOrFail($roleId)->delete();
    }

    // ========================================
    // PERMISSIONS MANAGEMENT
    // ========================================

    /**
     * Get all permissions.
     */
    public function getAllPermissions(): Collection
    {
        return Permission::orderBy('name')->get();
    }

    /**
     * Get permissions grouped by module.
     */
    public function getPermissionsGrouped(): array
    {
        $permissions = Permission::orderBy('name')->get();
        $grouped = [];

        foreach ($permissions as $permission) {
            $parts = explode('_', $permission->name);
            $module = ucfirst($parts[0] ?? 'general');
            $grouped[$module][] = $permission;
        }

        return $grouped;
    }

    /**
     * Create permission.
     */
    public function createPermission(array $data): Permission
    {
        return Permission::create([
            'name' => $data['name'],
            'guard_name' => 'web',
        ]);
    }

    /**
     * Get user statistics.
     */
    public function getStatistics(): array
    {
        return [
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
            'inactive_users' => User::where('is_active', false)->count(),
            'total_roles' => Role::count(),
        ];
    }
}
