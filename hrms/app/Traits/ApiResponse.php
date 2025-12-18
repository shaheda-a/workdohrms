<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * API Response Trait
 * 
 * Provides standardized API response methods for all controllers.
 * Ensures consistent response structure across all endpoints.
 * 
 * Response Structure:
 * {
 *   "success": true|false,
 *   "data": {},
 *   "message": "Descriptive message",
 *   "meta": {} // Optional, for pagination
 * }
 */
trait ApiResponse
{
    /**
     * Success response with data.
     */
    protected function success(
        mixed $data = null, 
        string $message = 'Success', 
        int $statusCode = 200
    ): JsonResponse {
        $response = [
            'success' => true,
            'data' => $this->formatData($data),
            'message' => $message,
        ];

        // Add pagination meta if applicable
        if ($data instanceof LengthAwarePaginator) {
            $response['meta'] = $this->getPaginationMeta($data);
            $response['data'] = $data->items();
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Success response for resource creation.
     */
    protected function created(
        mixed $data = null, 
        string $message = 'Resource created successfully'
    ): JsonResponse {
        return $this->success($data, $message, 201);
    }

    /**
     * Success response with no content.
     */
    protected function noContent(string $message = 'Operation successful'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => null,
            'message' => $message,
        ], 200);
    }

    /**
     * Error response.
     */
    protected function error(
        string $message = 'An error occurred', 
        int $statusCode = 400,
        mixed $errors = null
    ): JsonResponse {
        $response = [
            'success' => false,
            'data' => null,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Not found error response.
     */
    protected function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error($message, 404);
    }

    /**
     * Validation error response.
     */
    protected function validationError(
        mixed $errors, 
        string $message = 'Validation failed'
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'data' => null,
            'message' => $message,
            'errors' => $errors,
        ], 422);
    }

    /**
     * Unauthorized error response.
     */
    protected function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error($message, 401);
    }

    /**
     * Forbidden error response.
     */
    protected function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error($message, 403);
    }

    /**
     * Server error response.
     */
    protected function serverError(string $message = 'Internal server error'): JsonResponse
    {
        return $this->error($message, 500);
    }

    /**
     * Format data for response.
     */
    protected function formatData(mixed $data): mixed
    {
        if ($data instanceof LengthAwarePaginator) {
            return $data->items();
        }

        if ($data instanceof Collection) {
            return $data->values();
        }

        return $data;
    }

    /**
     * Get pagination metadata.
     */
    protected function getPaginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'total_pages' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'has_more_pages' => $paginator->hasMorePages(),
        ];
    }

    /**
     * Paginated response with custom meta.
     */
    protected function paginated(
        LengthAwarePaginator $paginator,
        string $message = 'Data retrieved successfully'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'message' => $message,
            'meta' => $this->getPaginationMeta($paginator),
        ], 200);
    }

    /**
     * Collection response (non-paginated list).
     */
    protected function collection(
        Collection|array $data,
        string $message = 'Data retrieved successfully'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'data' => $data instanceof Collection ? $data->values() : $data,
            'message' => $message,
            'meta' => [
                'total' => $data instanceof Collection ? $data->count() : count($data),
            ],
        ], 200);
    }
}
