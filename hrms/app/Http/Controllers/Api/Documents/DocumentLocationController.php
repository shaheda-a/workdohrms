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
     * Store new Document Location
     */
    public function store(Request $request)
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
            $location = DocumentLocation::create($request->only(['location_type', 'org_id', 'company_id']));

            return response()->json([
                'success' => true,
                'message' => 'Document location created successfully',
                'data' => $location,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show single Document Location
     */
    public function show($id)
    {
        try {
            $location = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig'])->find($id);

            if (! $location) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document location not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $location,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update Document Location
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'location_type' => 'sometimes|integer|in:1,2,3',
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
            $location = DocumentLocation::findOrFail($id);
            $location->update($request->only(['location_type', 'org_id', 'company_id']));

            return response()->json([
                'success' => true,
                'message' => 'Document location updated successfully',
                'data' => $location,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete Document Location
     */
    public function destroy($id)
    {
        try {
            $location = DocumentLocation::findOrFail($id);
            $location->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document location deleted successfully',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get locations by type (helper endpoint)
     */
    public function getByType($type)
    {
        try {
            $locations = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig'])
                ->where('location_type', $type)
                ->get();

            $typeName = match ($type) {
                1 => 'Local',
                2 => 'Wasabi',
                3 => 'AWS',
                default => 'Unknown'
            };

            return response()->json([
                'success' => true,
                'message' => "{$typeName} locations retrieved",
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
     * Get location type by Organization ID
     */
    public function getLocationTypeByOrg($orgId)
    {
        try {
            $locations = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig'])
                ->where('org_id', $orgId)
                ->get();

            if ($locations->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No locations found for this organization',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Organization locations retrieved successfully',
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
     * Get location type by Company ID
     */
    public function getLocationTypeByCompany($companyId)
    {
        try {
            $locations = DocumentLocation::with(['localConfig', 'wasabiConfig', 'awsConfig'])
                ->where('company_id', $companyId)
                ->get();

            if ($locations->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No locations found for this company',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Company locations retrieved successfully',
                'data' => $locations,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
