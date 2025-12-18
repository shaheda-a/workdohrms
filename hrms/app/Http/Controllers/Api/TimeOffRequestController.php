<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LeaveService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Time Off Request Controller
 * 
 * Handles HTTP requests for leave/time-off management.
 */
class TimeOffRequestController extends Controller
{
    use ApiResponse;

    protected LeaveService $service;

    public function __construct(LeaveService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of leave requests.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'staff_member_id',
                'category_id',
                'status',
                'start_date',
                'end_date',
                'month',
                'year',
                'search',
                'paginate',
                'per_page',
                'page',
            ]);

            $result = $this->service->getAllRequests($params);

            return $this->success($result, 'Leave requests retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve leave requests: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created leave request.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'staff_member_id' => 'required|exists:staff_members,id',
                'time_off_category_id' => 'required|exists:time_off_categories,id',
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
                'reason' => 'nullable|string|max:1000',
            ]);

            // Check for overlapping requests
            if ($this->service->hasOverlappingRequest(
                $validated['staff_member_id'],
                $validated['start_date'],
                $validated['end_date']
            )) {
                return $this->error('You already have a leave request for this date range', 422);
            }

            $leaveRequest = $this->service->createRequest($validated);
            $leaveRequest->load(['staffMember', 'category']);

            return $this->created($leaveRequest, 'Leave request created successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to create leave request: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified leave request.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $request = $this->service->findById($id);

            if (!$request) {
                return $this->notFound('Leave request not found');
            }

            return $this->success($request, 'Leave request retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve leave request: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified leave request.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'time_off_category_id' => 'sometimes|required|exists:time_off_categories,id',
                'start_date' => 'sometimes|required|date',
                'end_date' => 'sometimes|required|date|after_or_equal:start_date',
                'reason' => 'nullable|string|max:1000',
            ]);

            $leaveRequest = $this->service->update($id, $validated);

            return $this->success($leaveRequest, 'Leave request updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Leave request not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to update leave request: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified leave request.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return $this->noContent('Leave request deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Leave request not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to delete leave request: ' . $e->getMessage());
        }
    }

    /**
     * Approve a leave request.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        try {
            $notes = $request->input('notes');
            $approverId = $request->user()->id;

            $leaveRequest = $this->service->approve($id, $approverId, $notes);

            return $this->success($leaveRequest, 'Leave request approved successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Leave request not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to approve leave request: ' . $e->getMessage());
        }
    }

    /**
     * Reject a leave request.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $approverId = $request->user()->id;

            $leaveRequest = $this->service->reject($id, $approverId, $validated['reason']);

            return $this->success($leaveRequest, 'Leave request rejected');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Leave request not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to reject leave request: ' . $e->getMessage());
        }
    }

    /**
     * Cancel a leave request.
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $leaveRequest = $this->service->cancel($id);

            return $this->success($leaveRequest, 'Leave request cancelled successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Leave request not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to cancel leave request: ' . $e->getMessage());
        }
    }

    /**
     * Get leave balance for an employee.
     */
    public function balance(Request $request, int $staffMemberId): JsonResponse
    {
        try {
            $year = $request->input('year', now()->year);
            $balance = $this->service->getLeaveBalance($staffMemberId, $year);

            return $this->success($balance, 'Leave balance retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve leave balance: ' . $e->getMessage());
        }
    }

    /**
     * Get leave statistics.
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $staffMemberId = $request->input('staff_member_id');
            $stats = $this->service->getStatistics($staffMemberId);

            return $this->success($stats, 'Leave statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve leave statistics: ' . $e->getMessage());
        }
    }

    /**
     * Get employees on leave for a date.
     */
    public function onLeave(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date');
            $employees = $this->service->getOnLeave($date);

            return $this->collection($employees, 'Employees on leave retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve employees on leave: ' . $e->getMessage());
        }
    }
}
