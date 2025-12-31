<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Permission::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        if ($request->has('resource')) {
            $query->where('resource', $request->resource);
        }

        $permissions = $query->orderBy('resource')->orderBy('sort_order')->get();

        return $this->success($permissions, 'Permissions retrieved successfully');
    }

    public function groupedByResource(): JsonResponse
    {
        $resources = Resource::orderBy('sort_order')->get();
        $permissions = Permission::orderBy('sort_order')->get();

        $grouped = $resources->map(function ($resource) use ($permissions) {
            return [
                'id' => $resource->id,
                'name' => $resource->name,
                'slug' => $resource->slug,
                'icon' => $resource->icon,
                'description' => $resource->description,
                'sort_order' => $resource->sort_order,
                'permissions' => $permissions->where('resource', $resource->slug)->values(),
            ];
        });

        return $this->success($grouped, 'Permissions grouped by resource retrieved successfully');
    }

    public function show(int $id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        return $this->success($permission, 'Permission retrieved successfully');
    }
}
