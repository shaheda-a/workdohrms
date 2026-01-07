<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use App\Services\OrganizationService;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class OrganizationController extends Controller
{
    protected $orgService;

    public function __construct(OrganizationService $orgService)
    {
        $this->orgService = $orgService;
    }

    /**
     * List all Organizations with pagination
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 10);
            $search = $request->input('search', null);

            $organizations = $this->orgService->getPaginatedOrganizations($perPage, $search);

            return response()->json([
                'success' => true,
                'data' => $organizations->items(),
                'meta' => [
                    'current_page' => $organizations->currentPage(),
                    'total' => $organizations->total(),
                    'per_page' => $organizations->perPage(),
                    'last_page' => $organizations->lastPage(),
                    'from' => $organizations->firstItem(),
                    'to' => $organizations->lastItem(),
                ]
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created Organization.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Organization fields
            'org_name' => 'required|string|max:255',
            'address' => 'nullable|string',

            // User fields
            'user_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // 1️⃣ Create Organization
            $organization = Organization::create([
                'name' => $request->org_name,
                'address' => $request->address,
            ]);

            // 2️⃣ Create User and STORE org_id
            $user = User::create([
                'name' => $request->user_name,
                'email' => $request->email,
                'password' => Hash::make($request->password ?? 'password123'),
                'org_id' => $organization->id, // ✅ STORED HERE
                'is_active' => true,
            ]);

            $user->assignRole('organisation');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Organization and user created successfully',
                'data' => [
                    'organization' => $organization,
                    'user' => $user,
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create organization',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * Get Organization Details
     */
    public function show($id)
    {
        try {
            $organization = $this->orgService->getOrganization($id);
            if (!$organization) {
                return response()->json(['success' => false, 'message' => 'Organization not found'], 404);
            }
            return response()->json(['success' => true, 'data' => $organization]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update Organization
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $organization = $this->orgService->updateOrganization($id, $request->all());
            return response()->json([
                'success' => true,
                'message' => 'Organization updated successfully',
                'data' => $organization
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete Organization
     */
    public function destroy($id)
    {
        try {
            $this->orgService->deleteOrganization($id);
            return response()->json([
                'success' => true,
                'message' => 'Organization deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
