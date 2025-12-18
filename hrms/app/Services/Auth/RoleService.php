<?php

namespace App\Services\Auth;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Role Service
 *
 * Handles all business logic for role and permission management.
 */
class RoleService
{
    /**
     * Get all roles with filtering and pagination.
     */
    public function getAllRoles(array $params = []): LengthAwarePaginator|Collection
    {
        $query = Role::with('permissions');

        if (! empty($params['search'])) {
            $query->where('name', 'like', '%'.$params['search'].'%');
        }

        $query->orderBy('name');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 15;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a role.
     */
    public function createRole(array $data): Role
    {
        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => $data['guard_name'] ?? 'web',
        ]);

        if (! empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return $role->load('permissions');
    }

    /**
     * Update a role.
     */
    public function updateRole(int $id, array $data): Role
    {
        $role = Role::findOrFail($id);

        if (isset($data['name'])) {
            $role->update(['name' => $data['name']]);
        }

        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return $role->fresh('permissions');
    }

    /**
     * Delete a role.
     */
    public function deleteRole(int $id): bool
    {
        return Role::findOrFail($id)->delete();
    }

    /**
     * Get role by ID with permissions.
     */
    public function getRoleById(int $id): Role
    {
        return Role::with('permissions')->findOrFail($id);
    }

    /**
     * Get roles for dropdown.
     */
    public function getRolesForDropdown(): Collection
    {
        return Role::select(['id', 'name'])->orderBy('name')->get();
    }

    // ========================================
    // PERMISSIONS
    // ========================================

    /**
     * Get all permissions.
     */
    public function getAllPermissions(array $params = []): LengthAwarePaginator|Collection
    {
        $query = Permission::query();

        if (! empty($params['search'])) {
            $query->where('name', 'like', '%'.$params['search'].'%');
        }

        $query->orderBy('name');

        $paginate = ($params['paginate'] ?? 'true') !== 'false';
        $perPage = $params['per_page'] ?? 50;

        return $paginate
            ? $query->paginate($perPage)
            : $query->get();
    }

    /**
     * Create a permission.
     */
    public function createPermission(array $data): Permission
    {
        return Permission::create([
            'name' => $data['name'],
            'guard_name' => $data['guard_name'] ?? 'web',
        ]);
    }

    /**
     * Update a permission.
     */
    public function updatePermission(int $id, array $data): Permission
    {
        $permission = Permission::findOrFail($id);
        $permission->update($data);

        return $permission->fresh();
    }

    /**
     * Delete a permission.
     */
    public function deletePermission(int $id): bool
    {
        return Permission::findOrFail($id)->delete();
    }

    /**
     * Get permissions grouped by module.
     */
    public function getPermissionsGrouped(): Collection
    {
        $permissions = Permission::all();

        return $permissions->groupBy(function ($permission) {
            $parts = explode('.', $permission->name);

            return $parts[0] ?? 'general';
        });
    }
}
