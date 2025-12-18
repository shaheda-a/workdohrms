<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Services\Organization\OrganizationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Job Title Controller
 *
 * Handles HTTP requests for job title (designation) management.
 */
class JobTitleController extends Controller
{
    use ApiResponse;

    protected OrganizationService $service;

    public function __construct(OrganizationService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of job titles.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'division_id',
                'active_only',
                'search',
                'paginate',
                'per_page',
                'page',
            ]);

            $result = $this->service->getAllJobTitles($params);

            return $this->success($result, 'Job titles retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve job titles: '.$e->getMessage());
        }
    }

    /**
     * Store a newly created job title.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'division_id' => 'required|exists:divisions,id',
                'notes' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $jobTitle = $this->service->createJobTitle($validated, $request->user()?->id);
            $jobTitle->load('division');

            return $this->created($jobTitle, 'Job title created successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to create job title: '.$e->getMessage());
        }
    }

    /**
     * Display the specified job title.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $jobTitle = $this->service->findJobTitle($id);

            if (! $jobTitle) {
                return $this->notFound('Job title not found');
            }

            return $this->success($jobTitle, 'Job title retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve job title: '.$e->getMessage());
        }
    }

    /**
     * Update the specified job title.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'division_id' => 'sometimes|required|exists:divisions,id',
                'notes' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $jobTitle = $this->service->updateJobTitle($id, $validated);

            return $this->success($jobTitle, 'Job title updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Job title not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to update job title: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified job title.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->deleteJobTitle($id);

            return $this->noContent('Job title deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Job title not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to delete job title: '.$e->getMessage());
        }
    }

    /**
     * Get job titles by division.
     */
    public function fetchByDivision(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'division_id' => 'required|exists:divisions,id',
            ]);

            $jobTitles = $this->service->getJobTitlesByDivision($validated['division_id']);

            return $this->collection($jobTitles, 'Job titles retrieved successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve job titles: '.$e->getMessage());
        }
    }
}
