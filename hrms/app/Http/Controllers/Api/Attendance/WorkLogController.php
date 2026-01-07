<?php

namespace App\Http\Controllers\Api\Attendance;

use App\Http\Controllers\Controller;
use App\Models\StaffMember;
use App\Services\Attendance\AttendanceService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Work Log Controller
 *
 * Handles HTTP requests for attendance/work log management.
 */
class WorkLogController extends Controller
{
    use ApiResponse;

    protected AttendanceService $service;

    public function __construct(AttendanceService $service)
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
     * Display work logs for the current user (My Work Logs page).
     * This should return ONLY the logged-in user's work logs, regardless of role.
     */
    public function myLogs(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'start_date',
                'end_date',
                'month',
                'year',
                'paginate',
                'per_page',
                'page',
            ]);

            $user = $request->user();
            
            // Get the staff member ID for the logged-in user
            $staffMemberId = $this->getStaffMemberId($user);
            
            if (!$staffMemberId) {
                // If user doesn't have a staff member record, return empty
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
                ], 'Work logs retrieved successfully');
            }
            
            // ALWAYS filter by the logged-in user's staff_member_id
            $params['staff_member_id'] = $staffMemberId;

            $result = $this->service->getAll($params);

            return $this->success($result, 'Work logs retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve work logs: ' . $e->getMessage());
        }
    }

    /**
     * Display a listing of work logs.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'staff_member_id',
                'office_location_id',
                'date',
                'start_date',
                'end_date',
                'month',
                'year',
                'paginate',
                'per_page',
                'page',
            ]);

            $user = $request->user();

            // Check user role and adjust parameters
            if (!$this->isAdminUser($user)) {
                // For non-admin users, they can only see their own work logs
                $staffMemberId = $this->getStaffMemberId($user);
                
                if ($staffMemberId) {
                    $params['staff_member_id'] = $staffMemberId;
                } else {
                    return $this->error('Staff member not found', 404);
                }
            }
            // For admin users, they can see all work logs (staff_member_id filter remains optional)

            $result = $this->service->getAll($params);

            return $this->success($result, 'Work logs retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve work logs: ' . $e->getMessage());
        }
    }

    /**
     * Store a new work log (manual attendance entry).
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'staff_member_id' => 'required|exists:staff_members,id',
                'log_date' => 'required|date',
                'clock_in' => 'nullable|date_format:H:i',
                'clock_out' => 'nullable|date_format:H:i|after:clock_in',
                'status' => 'nullable|in:present,absent,late,half_day,leave',
                'notes' => 'nullable|string|max:500',
            ]);

            $workLog = $this->service->recordAttendance($validated);

            return $this->created($workLog, 'Attendance recorded successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to record attendance: '.$e->getMessage());
        }
    }

    /**
     * Display the specified work log.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $workLog = $this->service->findById($id);

            if (! $workLog) {
                return $this->notFound('Work log not found');
            }

            return $this->success($workLog, 'Work log retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve work log: '.$e->getMessage());
        }
    }

    /**
     * Update the specified work log.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'clock_in' => 'nullable|date_format:H:i',
                'clock_out' => 'nullable|date_format:H:i',
                'status' => 'nullable|in:present,absent,late,half_day,leave',
                'notes' => 'nullable|string|max:500',
            ]);

            $workLog = $this->service->update($id, $validated);

            return $this->success($workLog, 'Work log updated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Work log not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to update work log: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified work log.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return $this->noContent('Work log deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Work log not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to delete work log: '.$e->getMessage());
        }
    }

    /**
     * Clock in for the current user.
     */
    public function clockIn(Request $request): JsonResponse
    {
        try {
            $staffMemberId = $request->input('staff_member_id') ?? $request->user()->staffMember?->id;

            if (! $staffMemberId) {
                return $this->error('Staff member not found', 404);
            }

            $workLog = $this->service->clockIn($staffMemberId, [
                'ip_address' => $request->ip(),
                'location' => $request->input('location'),
            ]);

            return $this->success($workLog, 'Clocked in successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Clock out for the current user.
     */
    public function clockOut(Request $request): JsonResponse
    {
        try {
            $staffMemberId = $request->input('staff_member_id') ?? $request->user()->staffMember?->id;

            if (! $staffMemberId) {
                return $this->error('Staff member not found', 404);
            }

            $workLog = $this->service->clockOut($staffMemberId, [
                'ip_address' => $request->ip(),
                'location' => $request->input('location'),
            ]);

            return $this->success($workLog, 'Clocked out successfully');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * Get today's attendance summary.
     */
    public function todaySummary(): JsonResponse
    {
        try {
            $summary = $this->service->getTodaySummary();

            return $this->success($summary, 'Today\'s attendance summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve attendance summary: '.$e->getMessage());
        }
    }

    /**
     * Get attendance report.
     */
    public function report(Request $request): JsonResponse
    {
        try {
            $params = $request->only(['start_date', 'end_date']);
            $report = $this->service->getAttendanceReport($params);

            return $this->collection($report, 'Attendance report generated successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to generate attendance report: '.$e->getMessage());
        }
    }

    /**
     * Get monthly attendance for an employee.
     */
    public function monthlyAttendance(Request $request, int $staffMemberId): JsonResponse
    {
        try {
            $month = $request->input('month', now()->month);
            $year = $request->input('year', now()->year);

            $attendance = $this->service->getEmployeeMonthlyAttendance($staffMemberId, $month, $year);

            return $this->success($attendance, 'Monthly attendance retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve monthly attendance: '.$e->getMessage());
        }
    }

    /**
     * Get current attendance status for an employee.
     */
    public function currentStatus(Request $request): JsonResponse
    {
        try {
            $staffMemberId = $request->input('staff_member_id') ?? $request->user()->staffMember?->id;

            if (! $staffMemberId) {
                return $this->error('Staff member not found', 404);
            }

            $status = $this->service->getCurrentStatus($staffMemberId);

            return $this->success($status, 'Current status retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve current status: '.$e->getMessage());
        }
    }

    /**
     * Bulk record attendance.
     */
    public function bulkRecord(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'records' => 'required|array|min:1',
                'records.*.staff_member_id' => 'required|exists:staff_members,id',
                'records.*.log_date' => 'required|date',
                'records.*.status' => 'required|in:present,absent,late,half_day,leave',
            ]);

            $records = $this->service->bulkRecordAttendance($validated['records']);

            return $this->success([
                'recorded' => $records->count(),
            ], 'Bulk attendance recorded successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to record bulk attendance: '.$e->getMessage());
        }
    }

    /**
     * Bulk store attendance (alias for bulkRecord for route compatibility).
     */
    public function bulkStore(Request $request): JsonResponse
    {
        return $this->bulkRecord($request);
    }

    /**
     * Get attendance summary for a date range.
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $staffMemberId = $request->input('staff_member_id');
            $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
            $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

            $summary = $this->service->getSummaryForDateRange($startDate, $endDate, $staffMemberId);

            return $this->success($summary, 'Attendance summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve attendance summary: '.$e->getMessage());
        }
    }

     /**
     * Get work log summary for the current user
     */
    public function mySummary(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $staffMemberId = $this->getStaffMemberId($user);
            
            if (!$staffMemberId) {
                return $this->success([], 'No work log summary found');
            }

            $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
            $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

            $summary = $this->service->getSummaryForDateRange($startDate, $endDate, $staffMemberId);

            return $this->success($summary, 'Work log summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve work log summary: ' . $e->getMessage());
        }
    }

    /**
     * Get monthly attendance for the current user
     */
    public function myMonthlyAttendance(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $staffMemberId = $this->getStaffMemberId($user);
            
            if (!$staffMemberId) {
                return $this->success([], 'No monthly attendance found');
            }

            $month = $request->input('month', now()->month);
            $year = $request->input('year', now()->year);

            $attendance = $this->service->getEmployeeMonthlyAttendance($staffMemberId, $month, $year);

            return $this->success($attendance, 'Monthly attendance retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve monthly attendance: ' . $e->getMessage());
        }
    }
}
