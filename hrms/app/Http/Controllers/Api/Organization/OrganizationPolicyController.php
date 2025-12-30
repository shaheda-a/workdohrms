<?php

namespace App\Http\Controllers\Api\Organization;

use App\Http\Controllers\Controller;
use App\Models\OrganizationPolicy;
use App\Models\StaffMember;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OrganizationPolicyController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = OrganizationPolicy::with('author');

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $policies = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($policies);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'document' => 'nullable|file|max:10240', // 10MB
            'version' => 'nullable|string|max:20',
            'effective_date' => 'required|date',
            'requires_acknowledgment' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('document')) {
            $file = $request->file('document');
            $validated['document_path'] = $file->store('policies', 'public');
        }

        $validated['author_id'] = $request->user()->id;
        $policy = OrganizationPolicy::create($validated);

        return $this->created($policy, 'Policy created');
    }

    public function show(OrganizationPolicy $organizationPolicy)
    {
        return $this->success($organizationPolicy->load(['author', 'acknowledgments']));
    }

    public function update(Request $request, OrganizationPolicy $organizationPolicy)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'summary' => 'nullable|string',
            'document' => 'nullable|file|max:10240',
            'version' => 'nullable|string|max:20',
            'effective_date' => 'sometimes|required|date',
            'requires_acknowledgment' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('document')) {
            // Delete old file
            if ($organizationPolicy->document_path) {
                Storage::disk('public')->delete($organizationPolicy->document_path);
            }
            $validated['document_path'] = $request->file('document')->store('policies', 'public');
        }

        $organizationPolicy->update($validated);

        return $this->success($organizationPolicy->fresh(), 'Policy updated');
    }

    /**
     * Acknowledge a policy.
     */
    public function acknowledge(Request $request, OrganizationPolicy $organizationPolicy)
    {
        $staffMember = StaffMember::where('user_id', $request->user()->id)->first();

        if (! $staffMember) {
            return $this->error('Staff member not found', 404);
        }

        $organizationPolicy->acknowledgments()->syncWithoutDetaching([
            $staffMember->id => [
                'acknowledged_at' => now(),
                'ip_address' => $request->ip(),
            ],
        ]);

        return $this->noContent('Policy acknowledged');
    }

    /**
     * Get pending policies for current user.
     */
    public function pending(Request $request)
    {
        $staffMember = StaffMember::where('user_id', $request->user()->id)->first();

        if (! $staffMember) {
            return $this->success([]);
        }

        $acknowledgedIds = $staffMember->belongsToMany(OrganizationPolicy::class, 'policy_acknowledgments')
            ->pluck('organization_policies.id');

        $pending = OrganizationPolicy::active()
            ->requiringAcknowledgment()
            ->whereNotIn('id', $acknowledgedIds)
            ->get();

        return $this->success($pending);
    }

    public function destroy(OrganizationPolicy $organizationPolicy)
    {
        if ($organizationPolicy->document_path) {
            Storage::disk('public')->delete($organizationPolicy->document_path);
        }

        $organizationPolicy->delete();

        return $this->noContent('Policy deleted');
    }
}
