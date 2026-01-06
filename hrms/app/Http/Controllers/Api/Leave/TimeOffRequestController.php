<?php

namespace App\Http\Controllers\Api\Leave;

use App\Http\Controllers\Controller;
use App\Models\StaffMember;
use App\Services\Leave\LeaveService;
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
     * Check if user is admin or has admin-like roles
     */
    protected function isAdminUser($user): bool
    {
        return $user->hasAnyRole(['admin', 'administrator', 'organisation', 'company', 'hr']);
    }

    /**
     * Get staff member ID for non-admin users
     */
    protected function getStaffMemberId($user): ?int
    {
        $staffMember = StaffMember::where('user_id', $user->id)->first();
        return $staffMember ? $staffMember->id : null;
    }

    /**
     * Display a listing of leave requests (for My Leave Requests page).
     * This should return ONLY the logged-in user's leaves, regardless of role.
     */
    public function myRequests(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
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

            $user = $request->user();
            
            // Get the staff member ID for the logged-in user
            $staffMemberId = $this->getStaffMemberId($user);
            
            if (!$staffMemberId) {
                // If admin doesn't have a staff member record, they won't see any leaves
                // You might want to create a staff member record for admin users
                return $this->success([
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'from' => null,
                        'last_page' => 1,
                        'links' => [],
                        'path' => $request->url(),
                        'per_page' => $params['per_page'] ?? 10,
                        'to' => null,
                        'total' => 0,
                    ]
                ], 'Leave requests retrieved successfully');
            }
            
            // ALWAYS filter by the logged-in user's staff_member_id
            $params['staff_member_id'] = $staffMemberId;

            $result = $this->service->getAllRequests($params);

            return $this->success($result, 'Leave requests retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve leave requests: ' . $e->getMessage());
        }
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

            $user = $request->user();

            // Check user role and adjust parameters
            if (!$this->isAdminUser($user)) {
                // For non-admin users, they can only see their own leaves
                $staffMemberId = $this->getStaffMemberId($user);
                
                if ($staffMemberId) {
                    $params['staff_member_id'] = $staffMemberId;
                } else {
                    return $this->error('Staff member not found', 404);
                }
            }
            // For admin users, they can see all leaves (staff_member_id filter remains optional)

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
            $user = $request->user();
            
            // For non-admin users, they can only apply for themselves
            if (!$this->isAdminUser($user)) {
                $staffMemberId = $this->getStaffMemberId($user);
                if (!$staffMemberId) {
                    return $this->error('Staff member not found', 404);
                }
                // Force the staff_member_id to be the current user's staff member ID
                $request->merge(['staff_member_id' => $staffMemberId]);
            }

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
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $leaveRequest = $this->service->findById($id);

            if (!$leaveRequest) {
                return $this->notFound('Leave request not found');
            }

            // Check if non-admin user is trying to access someone else's leave request
            if (!$this->isAdminUser($user)) {
                $staffMemberId = $this->getStaffMemberId($user);
                if (!$staffMemberId || $leaveRequest->staff_member_id != $staffMemberId) {
                    return $this->error('Unauthorized to view this leave request', 403);
                }
            }

            return $this->success($leaveRequest, 'Leave request retrieved successfully');
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
            $user = $request->user();
            $leaveRequest = $this->service->findById($id);

            if (!$leaveRequest) {
                return $this->notFound('Leave request not found');
            }

            // Check permissions
            if (!$this->isAdminUser($user)) {
                $staffMemberId = $this->getStaffMemberId($user);
                if (!$staffMemberId || $leaveRequest->staff_member_id != $staffMemberId) {
                    return $this->error('Unauthorized to update this leave request', 403);
                }
                
                // Staff can only update their own pending requests
                if ($leaveRequest->approval_status !== 'pending') {
                    return $this->error('Only pending leave requests can be updated', 422);
                }
            }

            $validated = $request->validate([
                'time_off_category_id' => 'sometimes|required|exists:time_off_categories,id',
                'start_date' => 'sometimes|required|date',
                'end_date' => 'sometimes|required|date|after_or_equal:start_date',
                'reason' => 'nullable|string|max:1000',
            ]);

            $updatedRequest = $this->service->update($id, $validated);

            return $this->success($updatedRequest, 'Leave request updated successfully');
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
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $leaveRequest = $this->service->findById($id);

            if (!$leaveRequest) {
                return $this->notFound('Leave request not found');
            }

            // Check permissions
            if (!$this->isAdminUser($user)) {
                $staffMemberId = $this->getStaffMemberId($user);
                if (!$staffMemberId || $leaveRequest->staff_member_id != $staffMemberId) {
                    return $this->error('Unauthorized to delete this leave request', 403);
                }
                
                // Staff can only delete their own pending requests
                if ($leaveRequest->approval_status !== 'pending') {
                    return $this->error('Only pending leave requests can be deleted', 422);
                }
            }

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
            $user = $request->user();
            
            // Only admin users can approve leave requests
            if (!$this->isAdminUser($user)) {
                return $this->error('Unauthorized to approve leave requests', 403);
            }

            $notes = $request->input('notes');
            $approverId = $user->id;

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
            $user = $request->user();
            
            // Only admin users can reject leave requests
            if (!$this->isAdminUser($user)) {
                return $this->error('Unauthorized to reject leave requests', 403);
            }

            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $approverId = $user->id;

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
    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $leaveRequest = $this->service->findById($id);

            if (!$leaveRequest) {
                return $this->notFound('Leave request not found');
            }

            // Check permissions
            if (!$this->isAdminUser($user)) {
                $staffMemberId = $this->getStaffMemberId($user);
                if (!$staffMemberId || $leaveRequest->staff_member_id != $staffMemberId) {
                    return $this->error('Unauthorized to cancel this leave request', 403);
                }
                
                // Staff can only cancel their own pending or approved requests
                if (!in_array($leaveRequest->approval_status, ['pending', 'approved'])) {
                    return $this->error('Only pending or approved leave requests can be cancelled', 422);
                }
            }

            $cancelledRequest = $this->service->cancel($id);

            return $this->success($cancelledRequest, 'Leave request cancelled successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Leave request not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to cancel leave request: ' . $e->getMessage());
        }
    }

    /**
     * Get leave statistics.
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($this->isAdminUser($user)) {
                // Admin can view statistics for any staff member or overall
                $staffMemberId = $request->input('staff_member_id');
            } else {
                // Staff member can only view their own statistics
                $staffMemberId = $this->getStaffMemberId($user);
                if (!$staffMemberId) {
                    return $this->error('Staff member not found', 404);
                }
            }

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

    /**
     * Process leave request approval (approve or decline).
     */
    public function processApproval(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Only admin users can process approvals
            if (!$this->isAdminUser($user)) {
                return $this->error('Unauthorized to process leave request approvals', 403);
            }

            $validated = $request->validate([
                'action' => 'required|in:approve,decline,approved,declined',
                'approval_remarks' => 'nullable|string|max:500',
                'remarks' => 'nullable|string|max:500',
            ]);

            $approverId = $user->id;

            // Normalize action value (accept both formats)
            $action = $validated['action'];
            $isApproved = in_array($action, ['approve', 'approved']);

            // Accept both 'remarks' and 'approval_remarks' for backward compatibility
            $remarks = $validated['approval_remarks'] ?? $validated['remarks'] ?? null;

            if ($isApproved) {
                $leaveRequest = $this->service->approve($id, $approverId, $remarks);
                return $this->success($leaveRequest, 'Leave request approved successfully');
            } else {
                $leaveRequest = $this->service->reject($id, $approverId, $remarks);
                return $this->success($leaveRequest, 'Leave request declined');
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Leave request not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to process leave request: ' . $e->getMessage());
        }
    }

    /**
     * Get leave balance for an employee.
     */
    public function getBalance(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $year = $request->input('year', now()->year);

            if ($this->isAdminUser($user)) {
                // Admin can view any staff member's balance
                $staffMemberId = $request->input('staff_member_id');
                if (!$staffMemberId) {
                    return $this->error('Staff member ID is required', 422);
                }
            } else {
                // Staff member can only view their own balance
                $staffMemberId = $this->getStaffMemberId($user);
                if (!$staffMemberId) {
                    return $this->error('Staff member not found', 404);
                }
            }

            $balance = $this->service->getLeaveBalance($staffMemberId, $year);

            return $this->success($balance, 'Leave balance retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve leave balance: ' . $e->getMessage());
        }
    }

    /**
 * Get leave balance for the current user.
 */
public function myBalance(Request $request): JsonResponse
{
    try {
        $user = $request->user();
        $year = $request->input('year', now()->year);

        // Get the staff member ID for the logged-in user
        $staffMemberId = $this->getStaffMemberId($user);
        
        if (!$staffMemberId) {
            // Return empty balances if user doesn't have a staff record
            return $this->success([], 'No leave balances found');
        }

        $balance = $this->service->getLeaveBalance($staffMemberId, $year);

        return $this->success($balance, 'Leave balance retrieved successfully');
    } catch (\Exception $e) {
        return $this->serverError('Failed to retrieve leave balance: ' . $e->getMessage());
    }
}

}