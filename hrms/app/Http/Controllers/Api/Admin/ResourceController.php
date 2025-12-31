<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Resource::query()->with('permissions');

        if ($request->has('search')) {
            $query->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('slug', 'like', '%'.$request->search.'%');
        }

        $resources = $query->orderBy('sort_order')->get();

        return $this->success($resources, 'Resources retrieved successfully');
    }

    public function show(int $id): JsonResponse
    {
        $resource = Resource::with('permissions')->findOrFail($id);

        return $this->success($resource, 'Resource retrieved successfully');
    }

    public function getBySlug(string $slug): JsonResponse
    {
        $resource = Resource::with('permissions')->where('slug', $slug)->firstOrFail();

        return $this->success($resource, 'Resource retrieved successfully');
    }
}
