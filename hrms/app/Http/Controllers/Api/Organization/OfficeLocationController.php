<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Services\Organization\OrganizationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Office Location Controller
 *
 * Handles HTTP requests for office location (branch) management.
 */
class OfficeLocationController extends Controller
{
    use ApiResponse;

    protected OrganizationService $service;

    public function __construct(OrganizationService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of office locations.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'active_only',
                'search',
                'paginate',
                'per_page',
                'page',
            ]);

            $result = $this->service->getAllLocations($params);

            return $this->success($result, 'Office locations retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve office locations: '.$e->getMessage());
        }
    }

    /**
     * Store a newly created office location.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255|unique:office_locations,title',
                'address' => 'nullable|string',
                'contact_phone' => 'nullable|string|max:20',
                'contact_email' => 'nullable|email',
                'is_active' => 'boolean',
            ]);

            $location = $this->service->createLocation($validated, $request->user()?->id);

            return $this->created($location, 'Office location created successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to create office location: '.$e->getMessage());
        }
    }

    /**
     * Display the specified office location.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $location = $this->service->findLocation($id);

            if (! $location) {
                return $this->notFound('Office location not found');
            }

            return $this->success($location, 'Office location retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve office location: '.$e->getMessage());
        }
    }

    /**
     * Update the specified office location.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255|unique:office_locations,title,'.$id,
                'address' => 'nullable|string',
                'contact_phone' => 'nullable|string|max:20',
                'contact_email' => 'nullable|email',
                'is_active' => 'boolean',
            ]);

            $location = $this->service->updateLocation($id, $validated);

            return $this->success($location, 'Office location updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Office location not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to update office location: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified office location.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->deleteLocation($id);

            return $this->noContent('Office location deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Office location not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to delete office location: '.$e->getMessage());
        }
    }
}
