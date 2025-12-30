<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Controller;
use App\Models\AllowedIpAddress;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class AllowedIpAddressController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = AllowedIpAddress::with('author');

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $ips = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $ips]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ip_address' => 'required|ip|unique:allowed_ip_addresses,ip_address',
            'label' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        $ip = AllowedIpAddress::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'IP address added to whitelist',
            'data' => $ip,
        ], 201);
    }

    public function show(AllowedIpAddress $allowedIpAddress)
    {
        return response()->json([
            'success' => true,
            'data' => $allowedIpAddress->load('author'),
        ]);
    }

    /**
     * Check if current IP is allowed.
     */
    public function check(Request $request)
    {
        $currentIp = $request->ip();
        $isAllowed = AllowedIpAddress::isAllowed($currentIp);

        return response()->json([
            'success' => true,
            'data' => [
                'ip' => $currentIp,
                'allowed' => $isAllowed,
            ],
        ]);
    }

    public function update(Request $request, AllowedIpAddress $allowedIpAddress)
    {
        $validated = $request->validate([
            'ip_address' => 'sometimes|required|ip|unique:allowed_ip_addresses,ip_address,'.$allowedIpAddress->id,
            'label' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $allowedIpAddress->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'IP address updated',
            'data' => $allowedIpAddress->fresh(),
        ]);
    }

    public function destroy(AllowedIpAddress $allowedIpAddress)
    {
        $allowedIpAddress->delete();

        return response()->json([
            'success' => true,
            'message' => 'IP address removed from whitelist',
        ]);
    }
}
