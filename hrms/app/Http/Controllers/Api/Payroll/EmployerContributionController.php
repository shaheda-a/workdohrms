<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\EmployerContribution;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class EmployerContributionController extends Controller
{
    use ApiResponse;

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

        return $this->success($contributions);
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

        return $this->created($contribution->load('staffMember'), 'Employer contribution created');
    }

    public function show(EmployerContribution $employerContribution)
    {
        return $this->success($employerContribution->load(['staffMember', 'author']));
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

        return $this->success($employerContribution->fresh('staffMember'), 'Employer contribution updated');
    }

    public function destroy(EmployerContribution $employerContribution)
    {
        $employerContribution->delete();

        return $this->noContent('Employer contribution deleted');
    }
}
