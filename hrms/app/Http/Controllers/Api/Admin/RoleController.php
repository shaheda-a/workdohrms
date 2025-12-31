<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RoleAuditLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Role::query()
            ->withCount(['permissions']);

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        $roles = $query->orderBy('hierarchy_level')->orderBy('name')->get();

        $roles->each(function ($role) {
            $role->users_count = \App\Models\User::role($role->name)->count();
        });

        return $this->success($roles, 'Roles retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'hierarchy_level' => 'nullable|integer|min:1|max:99',
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
            'is_system' => false,
            'hierarchy_level' => $validated['hierarchy_level'] ?? 99,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
        ]);

        RoleAuditLog::log(
            auth()->id(),
            'role_created',
            Role::class,
            $role->id,
            null,
            $role->toArray()
        );

        return $this->created($role->load('permissions'), 'Role created successfully');
    }

    public function show(int $id): JsonResponse
    {
        $role = Role::with(['permissions'])->findOrFail($id);
        $role->users_count = \App\Models\User::role($role->name)->count();

        return $this->success($role, 'Role retrieved successfully');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:roles,name,'.$id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'hierarchy_level' => 'nullable|integer|min:1|max:99',
        ]);

        $oldValues = $role->toArray();

        if ($role->is_system && isset($validated['name']) && $validated['name'] !== $role->name) {
            return $this->error('Cannot rename system roles', 403);
        }

        $role->update([
            'name' => $validated['name'] ?? $role->name,
            'description' => $validated['description'] ?? $role->description,
            'icon' => $validated['icon'] ?? $role->icon,
            'hierarchy_level' => $validated['hierarchy_level'] ?? $role->hierarchy_level,
        ]);

        RoleAuditLog::log(
            auth()->id(),
            'role_updated',
            Role::class,
            $role->id,
            $oldValues,
            $role->toArray()
        );

        return $this->success($role->load('permissions'), 'Role updated successfully');
    }

    public function destroy(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->is_system) {
            return $this->error('Cannot delete system roles', 403);
        }

        $oldValues = $role->toArray();

        RoleAuditLog::log(
            auth()->id(),
            'role_deleted',
            Role::class,
            $role->id,
            $oldValues,
            null
        );

        $role->delete();

        return $this->success(null, 'Role deleted successfully');
    }

    public function syncPermissions(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $oldPermissions = $role->permissions->pluck('name')->toArray();

        $role->syncPermissions($validated['permissions']);

        RoleAuditLog::log(
            auth()->id(),
            'permissions_synced',
            Role::class,
            $role->id,
            ['permissions' => $oldPermissions],
            ['permissions' => $validated['permissions']]
        );

        return $this->success($role->load('permissions'), 'Permissions synced successfully');
    }

    public function getPermissions(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        return $this->success($role->permissions, 'Role permissions retrieved successfully');
    }
}
