<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\OrganizationService;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
    protected $orgService;

    public function __construct(OrganizationService $orgService)
    {
        $this->orgService = $orgService;
    }

    /**
     * List all Companies with pagination
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 10);
            $search = $request->input('search', null);
            $orgId = $request->input('org_id', null);
            
            $companies = $this->orgService->getPaginatedCompanies($perPage, $search, $orgId);
            
            return response()->json([
                'success' => true,
                'data' => $companies->items(),
                'meta' => [
                    'current_page' => $companies->currentPage(),
                    'total' => $companies->total(),
                    'per_page' => $companies->perPage(),
                    'last_page' => $companies->lastPage(),
                    'from' => $companies->firstItem(),
                    'to' => $companies->lastItem(),
                ]
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created Company.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'org_id' => 'required|exists:organizations,id',
            'company_name' => 'required|string|max:255',
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
            $company = $this->orgService->createCompany($request->all());
            return response()->json([
                'success' => true,
                'message' => 'Company created successfully',
                'data' => $company
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get Company Details
     */
    public function show($id)
    {
        try {
            $company = $this->orgService->getCompany($id);
            if (!$company) {
                return response()->json(['success' => false, 'message' => 'Company not found'], 404);
            }
            return response()->json(['success' => true, 'data' => $company]);
        } catch (Exception $e) {
             return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update Company
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'org_id' => 'sometimes|exists:organizations,id',
            'company_name' => 'sometimes|string|max:255',
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
            $company = $this->orgService->updateCompany($id, $request->all());
            return response()->json([
                'success' => true,
                'message' => 'Company updated successfully',
                'data' => $company
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete Company
     */
    public function destroy($id)
    {
        try {
            $this->orgService->deleteCompany($id);
            return response()->json([
                'success' => true,
                'message' => 'Company deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
