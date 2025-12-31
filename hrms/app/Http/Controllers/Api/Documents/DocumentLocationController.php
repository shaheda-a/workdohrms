<?php

namespace App\Http\Controllers\Api\Documents;

use App\Http\Controllers\Controller;
use App\Models\DocumentLocation;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DocumentLocationController extends Controller
{
    use ApiResponse;

    /**
     * List all Document Locations
     */
    public function index(Request $request)
    {
        try {
            $query = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig']);

            // Filter by org/company if provided
            if ($request->has('org_id')) {
                $query->where('org_id', $request->org_id);
            }
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            }
            if ($request->has('location_type')) {
                $query->where('location_type', $request->location_type);
            }

            $locations = $query->get();

            return response()->json([
                'success' => true,
                'data' => $locations,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create or Update Document Location
     * If location exists for org/company, update it. Otherwise create new.
     */
    public function createOrUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'location_type' => 'required|integer|in:1,2,3', // 1=local, 2=wasabi, 3=aws
            'org_id' => 'nullable|exists:organizations,id',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $orgId = $request->input('org_id');
            $companyId = $request->input('company_id');
            $locationType = $request->input('location_type');

            // Build query to find existing location
            $query = DocumentLocation::query();

            if ($orgId && $companyId) {
                // Both org and company
                $query->where('org_id', $orgId)->where('company_id', $companyId);
            } elseif ($orgId) {
                // Only org
                $query->where('org_id', $orgId)->whereNull('company_id');
            } elseif ($companyId) {
                // Only company
                $query->where('company_id', $companyId)->whereNull('org_id');
            } else {
                // Global (both null)
                $query->whereNull('org_id')->whereNull('company_id');
            }

            $location = $query->first();

            if ($location) {
                // Update existing location
                $location->update(['location_type' => $locationType]);

                return response()->json([
                    'success' => true,
                    'message' => 'Document location updated successfully',
                    'data' => $location->load(['localConfig', 'wasabiConfig', 'awsConfig']),
                    'action' => 'updated',
                ], 200);
            } else {
                // Create new location
                $location = DocumentLocation::create([
                    'location_type' => $locationType,
                    'org_id' => $orgId,
                    'company_id' => $companyId,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Document location created successfully',
                    'data' => $location->load(['localConfig', 'wasabiConfig', 'awsConfig']),
                    'action' => 'created',
                ], 201);
            }
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store new Document Location (uses createOrUpdate for backward compatibility)
     */
    public function store(Request $request)
    {
        return $this->createOrUpdate($request);
    }


}
