<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\CompanyNotice;
use App\Models\StaffMember;
use Illuminate\Http\Request;

class CompanyNoticeController extends Controller
{
    public function index(Request $request)
    {
        $query = CompanyNotice::with('author');

        if ($request->boolean('active_only', false)) {
            $query->active();
        }
        if ($request->boolean('featured_only', false)) {
            $query->featured();
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }

        $notices = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $notices]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'publish_date' => 'required|date',
            'expire_date' => 'nullable|date|after:publish_date',
            'is_company_wide' => 'boolean',
            'is_featured' => 'boolean',
            'recipient_ids' => 'nullable|array',
            'recipient_ids.*' => 'exists:staff_members,id',
        ]);

        $validated['author_id'] = $request->user()->id;
        $notice = CompanyNotice::create(collect($validated)->except('recipient_ids')->toArray());

        // Attach recipients if not company-wide
        if (! ($validated['is_company_wide'] ?? true) && ! empty($validated['recipient_ids'])) {
            $notice->recipients()->attach($validated['recipient_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Company notice created',
            'data' => $notice->load('recipients'),
        ], 201);
    }

    public function show(CompanyNotice $companyNotice)
    {
        return response()->json([
            'success' => true,
            'data' => $companyNotice->load(['author', 'recipients']),
        ]);
    }

    public function update(Request $request, CompanyNotice $companyNotice)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'publish_date' => 'sometimes|required|date',
            'expire_date' => 'nullable|date',
            'is_company_wide' => 'boolean',
            'is_featured' => 'boolean',
            'recipient_ids' => 'nullable|array',
            'recipient_ids.*' => 'exists:staff_members,id',
        ]);

        $companyNotice->update(collect($validated)->except('recipient_ids')->toArray());

        // Sync recipients if provided
        if (isset($validated['recipient_ids'])) {
            $companyNotice->recipients()->sync($validated['recipient_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Company notice updated',
            'data' => $companyNotice->fresh(['author', 'recipients']),
        ]);
    }

    /**
     * Mark notice as read for current user's staff member.
     */
    public function markAsRead(Request $request, CompanyNotice $companyNotice)
    {
        $staffMember = StaffMember::where('user_id', $request->user()->id)->first();

        if (! $staffMember) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found',
            ], 404);
        }

        $companyNotice->recipients()->updateExistingPivot($staffMember->id, [
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notice marked as read',
        ]);
    }

    public function destroy(CompanyNotice $companyNotice)
    {
        $companyNotice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Company notice deleted',
        ]);
    }
}
