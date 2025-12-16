<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployerContribution;
use Illuminate\Http\Request;

class EmployerContributionController extends Controller
{
    public function index(Request $request)
    {
        $query = EmployerContribution::with(['staffMember', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $contributions = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return response()->json(['success' => true, 'data' => $contributions]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'title' => 'required|string|max:255',
            'contribution_type' => 'required|in:fixed,percentage',
            'amount' => 'required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date|after:effective_from',
            'is_active' => 'boolean',
        ]);

        $validated['author_id'] = $request->user()->id;
        $contribution = EmployerContribution::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Employer contribution created',
            'data' => $contribution->load('staffMember'),
        ], 201);
    }

    public function show(EmployerContribution $employerContribution)
    {
        return response()->json([
            'success' => true,
            'data' => $employerContribution->load(['staffMember', 'author']),
        ]);
    }

    public function update(Request $request, EmployerContribution $employerContribution)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'contribution_type' => 'sometimes|required|in:fixed,percentage',
            'amount' => 'sometimes|required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'effective_until' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $employerContribution->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Employer contribution updated',
            'data' => $employerContribution->fresh('staffMember'),
        ]);
    }

    public function destroy(EmployerContribution $employerContribution)
    {
        $employerContribution->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employer contribution deleted',
        ]);
    }
}
