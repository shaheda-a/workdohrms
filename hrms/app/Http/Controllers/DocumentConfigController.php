<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DocumentLocation;
use App\Models\DocumentLocalConfig;
use App\Models\DocumentWasabiConfig;
use App\Models\DocumentAwsConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log; // Import Log
use Exception;

class DocumentConfigController extends Controller
{
    // ==========================================
    // LOCAL CONFIGURATION
    // ==========================================

    /**
     * Store/Create Local Config
     */
    public function storeLocal(Request $request) 
    {
        $validator = Validator::make($request->all(), [
            'location_id' => 'required|exists:document_locations,id',
            'root_path' => 'required|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) return response()->json(['success'=>false, 'errors'=>$validator->errors()], 422);

        try {
            // Ensure location is actually 'local' type if needed, but assuming user sends correct ID
            $config = DocumentLocalConfig::create($request->all());
            return response()->json(['success' => true, 'message' => 'Local config created', 'data' => $config], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update Local Config
     */
    public function updateLocal(Request $request, $id) 
    {
        $validator = Validator::make($request->all(), [
            'root_path' => 'sometimes|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) return response()->json(['success'=>false, 'errors'=>$validator->errors()], 422);

        try {
            $config = DocumentLocalConfig::findOrFail($id);
            $config->update($request->all());
            return response()->json(['success' => true, 'message' => 'Local config updated', 'data' => $config]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // WASABI CONFIGURATION
    // ==========================================

    /**
     * Store/Create Wasabi Config
     */
    public function storeWasabi(Request $request)
    {
        Log::info('storeWasabi called', ['payload' => $request->all()]); // Added Log

        $validator = Validator::make($request->all(), [
            'location_id' => 'required|exists:document_locations,id',
            'bucket' => 'required|string',
            'region' => 'required|string',
            'access_key' => 'required|string',
            'secret_key' => 'required|string',
            'endpoint' => 'required|url',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            Log::error('storeWasabi validation failed', ['errors' => $validator->errors()]); // Added Log
            return response()->json(['success'=>false, 'errors'=>$validator->errors()], 422);
        }

        try {
            $config = DocumentWasabiConfig::create($request->all());
            Log::info('storeWasabi success', ['config_id' => $config->id]); // Added Log
            return response()->json(['success' => true, 'message' => 'Wasabi config created', 'data' => $config], 201);
        } catch (Exception $e) {
            Log::error('storeWasabi exception', ['message' => $e->getMessage()]); // Added Log
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update Wasabi Config
     */
    public function updateWasabi(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'bucket' => 'sometimes|string',
            'region' => 'sometimes|string',
            'access_key' => 'sometimes|string',
            'secret_key' => 'sometimes|string',
            'endpoint' => 'sometimes|url',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) return response()->json(['success'=>false, 'errors'=>$validator->errors()], 422);

        try {
            $config = DocumentWasabiConfig::findOrFail($id);
            $config->update($request->all());
            return response()->json(['success' => true, 'message' => 'Wasabi config updated', 'data' => $config]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // AWS CONFIGURATION
    // ==========================================

    /**
     * Store/Create AWS Config
     */
    public function storeAws(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'location_id' => 'required|exists:document_locations,id',
            'bucket' => 'required|string',
            'region' => 'required|string',
            'access_key' => 'required|string',
            'secret_key' => 'required|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) return response()->json(['success'=>false, 'errors'=>$validator->errors()], 422);

        try {
            $config = DocumentAwsConfig::create($request->all());
            return response()->json(['success' => true, 'message' => 'AWS config created', 'data' => $config], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update AWS Config
     */
    public function updateAws(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'bucket' => 'sometimes|string',
            'region' => 'sometimes|string',
            'access_key' => 'sometimes|string',
            'secret_key' => 'sometimes|string',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) return response()->json(['success'=>false, 'errors'=>$validator->errors()], 422);

        try {
            $config = DocumentAwsConfig::findOrFail($id);
            $config->update($request->all());
            return response()->json(['success' => true, 'message' => 'AWS config updated', 'data' => $config]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    // ==========================================
    // SHOW METHODS
    // ==========================================

    /**
     * Show Local Config by Location ID
     */
    public function showLocal($locationId)
    {
        try {
            $config = DocumentLocalConfig::where('location_id', $locationId)->first();
            return response()->json(['success' => true, 'data' => $config]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Show Wasabi Config by Location ID
     */
    public function showWasabi($locationId)
    {
        try {
            $config = DocumentWasabiConfig::where('location_id', $locationId)->first();
            return response()->json(['success' => true, 'data' => $config]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Show AWS Config by Location ID
     */
    public function showAws($locationId)
    {
        try {
            $config = DocumentAwsConfig::where('location_id', $locationId)->first();
            return response()->json(['success' => true, 'data' => $config]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($locationId)
    {
        try {
            $location = DocumentLocation::findOrFail($locationId);
            
            $config = null;
            if ($location->slug === 'local') {
                $config = DocumentLocalConfig::where('location_id', $locationId)->first();
            } elseif ($location->slug === 'wasabi') {
                $config = DocumentWasabiConfig::where('location_id', $locationId)->first();
            } elseif ($location->slug === 'aws') {
                $config = DocumentAwsConfig::where('location_id', $locationId)->first();
            }

            return response()->json(['success' => true, 'data' => $config]);

        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
