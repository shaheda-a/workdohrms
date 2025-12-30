<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\RoleAuditLog;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserRoleController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }]);

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->has('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        $perPage = $request->get('per_page', 15);
        $users = $query->paginate($perPage);

        $users->getCollection()->transform(function ($user) {
            $primaryRole = $user->roles->sortBy('hierarchy_level')->first();
            $user->primary_role = $primaryRole ? $primaryRole->name : null;
            $user->primary_role_icon = $primaryRole ? $primaryRole->icon : null;
            $user->roles_list = $user->roles->pluck('name')->toArray();

            return $user;
        });

        return $this->success([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ], 'Users retrieved successfully');
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }])->findOrFail($id);

        $primaryRole = $user->roles->sortBy('hierarchy_level')->first();
        $user->primary_role = $primaryRole ? $primaryRole->name : null;
        $user->primary_role_icon = $primaryRole ? $primaryRole->icon : null;
        $user->roles_list = $user->roles->pluck('name')->toArray();
        $user->permissions_list = $user->getAllPermissions()->pluck('name')->toArray();

        return $this->success($user, 'User retrieved successfully');
    }

    public function getUserRoles(int $id): JsonResponse
    {
        $user = User::with(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }])->findOrFail($id);

        return $this->success($user->roles, 'User roles retrieved successfully');
    }

    public function assignRoles(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $oldRoles = $user->roles->pluck('name')->toArray();

        $user->syncRoles($validated['roles']);

        RoleAuditLog::log(
            auth()->id(),
            'user_roles_assigned',
            User::class,
            $user->id,
            ['roles' => $oldRoles],
            ['roles' => $validated['roles']]
        );

        $user->load(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }]);

        $primaryRole = $user->roles->sortBy('hierarchy_level')->first();
        $user->primary_role = $primaryRole ? $primaryRole->name : null;
        $user->primary_role_icon = $primaryRole ? $primaryRole->icon : null;
        $user->roles_list = $user->roles->pluck('name')->toArray();

        return $this->success($user, 'Roles assigned successfully');
    }

    public function addRole(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $oldRoles = $user->roles->pluck('name')->toArray();

        $user->assignRole($validated['role']);

        RoleAuditLog::log(
            auth()->id(),
            'user_role_added',
            User::class,
            $user->id,
            ['roles' => $oldRoles],
            ['roles' => $user->roles->pluck('name')->toArray()]
        );

        $user->load(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }]);

        return $this->success($user, 'Role added successfully');
    }

    public function removeRole(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $oldRoles = $user->roles->pluck('name')->toArray();

        $user->removeRole($validated['role']);

        RoleAuditLog::log(
            auth()->id(),
            'user_role_removed',
            User::class,
            $user->id,
            ['roles' => $oldRoles],
            ['roles' => $user->roles->pluck('name')->toArray()]
        );

        $user->load(['roles' => function ($q) {
            $q->orderBy('hierarchy_level');
        }]);

        return $this->success($user, 'Role removed successfully');
    }
}
