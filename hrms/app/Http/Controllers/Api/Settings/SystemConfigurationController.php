<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\SystemConfiguration;
use Illuminate\Http\Request;

class SystemConfigurationController extends Controller
{
    public function index(Request $request)
    {
        $query = SystemConfiguration::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $configs = $query->orderBy('category')->orderBy('config_key')->get();

        return response()->json(['success' => true, 'data' => $configs]);
    }

    /**
     * Get a specific configuration value.
     */
    public function getValue(Request $request)
    {
        $request->validate([
            'key' => 'required|string',
            'default' => 'nullable',
        ]);

        $value = SystemConfiguration::getValue($request->key, $request->default);

        return response()->json([
            'success' => true,
            'data' => [
                'key' => $request->key,
                'value' => $value,
            ],
        ]);
    }

    /**
     * Set a configuration value.
     */
    public function setValue(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255',
            'value' => 'required',
            'type' => 'nullable|in:string,boolean,integer,float,json',
            'category' => 'nullable|string|max:100',
        ]);

        SystemConfiguration::setValue(
            $validated['key'],
            $validated['value'],
            $validated['type'] ?? 'string',
            $validated['category'] ?? 'general'
        );

        return response()->json([
            'success' => true,
            'message' => 'Configuration saved',
        ]);
    }

    /**
     * Bulk update configurations.
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'configs' => 'required|array',
            'configs.*.key' => 'required|string',
            'configs.*.value' => 'required',
            'configs.*.type' => 'nullable|in:string,boolean,integer,float,json',
            'configs.*.category' => 'nullable|string',
        ]);

        foreach ($validated['configs'] as $config) {
            SystemConfiguration::setValue(
                $config['key'],
                $config['value'],
                $config['type'] ?? 'string',
                $config['category'] ?? 'general'
            );
        }

        return response()->json([
            'success' => true,
            'message' => count($validated['configs']).' configurations updated',
        ]);
    }

    /**
     * Get all configurations by category.
     */
    public function getByCategory(Request $request, $category)
    {
        $configs = SystemConfiguration::getByCategory($category);

        return response()->json([
            'success' => true,
            'data' => $configs,
        ]);
    }

    public function destroy(SystemConfiguration $systemConfiguration)
    {
        $systemConfiguration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Configuration deleted',
        ]);
    }
}
