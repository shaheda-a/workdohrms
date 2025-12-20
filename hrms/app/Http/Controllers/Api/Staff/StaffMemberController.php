<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Services\Staff\StaffMemberService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Staff Member Controller
 *
 * Handles HTTP requests for staff member management.
 * All business logic is delegated to StaffMemberService.
 */
class StaffMemberController extends Controller
{
    use ApiResponse;

    protected StaffMemberService $service;

    public function __construct(StaffMemberService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of staff members.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'office_location_id',
                'division_id',
                'status',
                'search',
                'paginate',
                'per_page',
                'page',
                'order_by',
                'order',
            ]);

            $result = $this->service->getAll($params);

            return $this->success($result, 'Staff members retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve staff members: '.$e->getMessage());
        }
    }

    /**
     * Store a newly created staff member.
     *
     * Creates a new staff member along with an associated user account.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Inline validation for Scramble to detect request body parameters
            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'nullable|string|min:8',
                'personal_email' => 'nullable|email',
                'mobile_number' => 'nullable|string|max:20',
                'birth_date' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'home_address' => 'nullable|string',
                'nationality' => 'nullable|string|max:100',
                'passport_number' => 'nullable|string|max:50',
                'country_code' => 'nullable|string|max:3',
                'region' => 'nullable|string|max:100',
                'city_name' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:20',
                'biometric_id' => 'nullable|string|max:50',
                'office_location_id' => 'nullable|exists:office_locations,id',
                'division_id' => 'nullable|exists:divisions,id',
                'job_title_id' => 'nullable|exists:job_titles,id',
                'hire_date' => 'nullable|date',
                'bank_account_name' => 'nullable|string',
                'bank_account_number' => 'nullable|string|max:50',
                'bank_name' => 'nullable|string',
                'bank_branch' => 'nullable|string',
                'compensation_type' => 'nullable|in:monthly,hourly,daily,contract',
                'base_salary' => 'nullable|numeric|min:0',
            ]);

            $staffMember = $this->service->createWithUser(
                $validated,
                $request->user()?->id
            );

            $staffMember->load(['user', 'officeLocation', 'division', 'jobTitle']);

            return response()->json([
                'success' => true,
                'data' => $staffMember,
                'message' => 'Staff member created successfully',
            ], 201);
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to create staff member: '.$e->getMessage());
        }
    }

    /**
     * Display the specified staff member.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $staffMember = $this->service->getFullProfile($id);

            return $this->success($staffMember, 'Staff member retrieved successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff member not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve staff member: '.$e->getMessage());
        }
    }

    /**
     * Update the specified staff member.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            // Inline validation for Scramble to detect request body parameters
            $validated = $request->validate([
                'full_name' => 'sometimes|required|string|max:255',
                'personal_email' => 'nullable|email',
                'mobile_number' => 'nullable|string|max:20',
                'birth_date' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'home_address' => 'nullable|string',
                'nationality' => 'nullable|string|max:100',
                'passport_number' => 'nullable|string|max:50',
                'country_code' => 'nullable|string|max:3',
                'region' => 'nullable|string|max:100',
                'city_name' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:20',
                'biometric_id' => 'nullable|string|max:50',
                'office_location_id' => 'nullable|exists:office_locations,id',
                'division_id' => 'nullable|exists:divisions,id',
                'job_title_id' => 'nullable|exists:job_titles,id',
                'hire_date' => 'nullable|date',
                'bank_account_name' => 'nullable|string',
                'bank_account_number' => 'nullable|string|max:50',
                'bank_name' => 'nullable|string',
                'bank_branch' => 'nullable|string',
                'compensation_type' => 'nullable|in:monthly,hourly,daily,contract',
                'base_salary' => 'nullable|numeric|min:0',
                'employment_status' => 'nullable|in:active,on_leave,suspended,terminated,resigned',
            ]);

            $staffMember = $this->service->updateWithUser($id, $validated);

            return response()->json([
                'success' => true,
                'data' => $staffMember,
                'message' => 'Staff member updated successfully',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff member not found');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to update staff member: '.$e->getMessage());
        }
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->deactivate($id);

            return $this->noContent('Staff member deactivated successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Staff member not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to deactivate staff member: '.$e->getMessage());
        }
    }

    /**
     * Get staff members for dropdown.
     */
    public function dropdown(Request $request): JsonResponse
    {
        try {
            $params = $request->only(['office_location_id', 'division_id']);
            $result = $this->service->getForDropdown($params);

            return $this->collection($result, 'Staff dropdown data retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve dropdown data: '.$e->getMessage());
        }
    }

    /**
     * Validate store request.
     */
    protected function validateStoreRequest(Request $request): array
    {
        return $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
            'personal_email' => 'nullable|email',
            'mobile_number' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'home_address' => 'nullable|string',
            'nationality' => 'nullable|string|max:100',
            'passport_number' => 'nullable|string|max:50',
            'country_code' => 'nullable|string|max:3',
            'region' => 'nullable|string|max:100',
            'city_name' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'biometric_id' => 'nullable|string|max:50',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'division_id' => 'nullable|exists:divisions,id',
            'job_title_id' => 'nullable|exists:job_titles,id',
            'hire_date' => 'nullable|date',
            'bank_account_name' => 'nullable|string',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string',
            'bank_branch' => 'nullable|string',
            'compensation_type' => 'nullable|in:monthly,hourly,daily,contract',
            'base_salary' => 'nullable|numeric|min:0',
        ]);
    }

    /**
     * Validate update request.
     */
    protected function validateUpdateRequest(Request $request): array
    {
        return $request->validate([
            'full_name' => 'sometimes|required|string|max:255',
            'personal_email' => 'nullable|email',
            'mobile_number' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'home_address' => 'nullable|string',
            'nationality' => 'nullable|string|max:100',
            'passport_number' => 'nullable|string|max:50',
            'country_code' => 'nullable|string|max:3',
            'region' => 'nullable|string|max:100',
            'city_name' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'biometric_id' => 'nullable|string|max:50',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'division_id' => 'nullable|exists:divisions,id',
            'job_title_id' => 'nullable|exists:job_titles,id',
            'hire_date' => 'nullable|date',
            'bank_account_name' => 'nullable|string',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string',
            'bank_branch' => 'nullable|string',
            'compensation_type' => 'nullable|in:monthly,hourly,daily,contract',
            'base_salary' => 'nullable|numeric|min:0',
            'employment_status' => 'nullable|in:active,on_leave,suspended,terminated,resigned',
        ]);
    }
}
