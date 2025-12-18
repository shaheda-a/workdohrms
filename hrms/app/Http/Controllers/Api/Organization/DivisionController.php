<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Services\Organization\OrganizationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Division Controller
 *
 * Handles HTTP requests for division (department) management.
 */
class DivisionController extends Controller
{
    use ApiResponse;

    protected OrganizationService $service;

    public function __construct(OrganizationService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of divisions.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'office_location_id',
                'active_only',
                'search',
                'paginate',
                'per_page',
                'page',
            ]);

            $result = $this->service->getAllDivisions($params);

            return $this->success($result, 'Divisions retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve divisions: '.$e->getMessage());
        }
    }

    /**
     * Store a newly created division.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'office_location_id' => 'required|exists:office_locations,id',
                'notes' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $division = $this->service->createDivision($validated, $request->user()?->id);
            $division->load('officeLocation');

            return $this->created($division, 'Division created successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to create division: '.$e->getMessage());
        }
    }

    /**
     * Display the specified division.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $division = $this->service->findDivision($id);

            if (! $division) {
                return $this->notFound('Division not found');
            }

            return $this->success($division, 'Division retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve division: '.$e->getMessage());
        }
    }

    /**
     * Update the specified division.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'office_location_id' => 'sometimes|required|exists:office_locations,id',
                'notes' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $division = $this->service->updateDivision($id, $validated);

            return $this->success($division, 'Division updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Division not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to update division: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified division.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->deleteDivision($id);

            return $this->noContent('Division deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Division not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to delete division: '.$e->getMessage());
        }
    }

    /**
     * Get divisions by office location.
     */
    public function fetchByLocation(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'office_location_id' => 'required|exists:office_locations,id',
            ]);

            $divisions = $this->service->getDivisionsByLocation($validated['office_location_id']);

            return $this->collection($divisions, 'Divisions retrieved successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve divisions: '.$e->getMessage());
        }
    }
}
