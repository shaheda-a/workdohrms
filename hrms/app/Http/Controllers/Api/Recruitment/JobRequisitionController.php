<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\JobRequisition;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobRequisitionController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = JobRequisition::with(['division', 'jobTitle', 'requester', 'approver']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->division_id) {
            $query->where('division_id', $request->division_id);
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $requisitions = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return $this->success($requisitions);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'division_id' => 'nullable|exists:divisions,id',
            'job_title_id' => 'nullable|exists:job_titles,id',
            'number_of_positions' => 'required|integer|min:1',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'justification' => 'required|string',
            'required_skills' => 'nullable|array',
            'experience_required' => 'nullable|string',
            'budget_from' => 'nullable|numeric|min:0',
            'budget_to' => 'nullable|numeric|min:0',
            'target_date' => 'nullable|date|after:today',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $data = $request->all();
        $data['requested_by'] = auth()->user()->staffMember?->id;
        $data['status'] = 'pending';

        $requisition = JobRequisition::create($data);

        return $this->created($requisition->load(['division', 'jobTitle']), 'Job requisition created successfully');

        return $this->success($jobRequisition);
    }

    public function update(Request $request, JobRequisition $jobRequisition)
    {
        if ($jobRequisition->status !== 'draft' && $jobRequisition->status !== 'pending') {
            return $this->error('Cannot update approved/rejected requisition', 400);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'division_id' => 'nullable|exists:divisions,id',
            'job_title_id' => 'nullable|exists:job_titles,id',
            'number_of_positions' => 'sometimes|integer|min:1',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'justification' => 'sometimes|string',
            'required_skills' => 'nullable|array',
            'experience_required' => 'nullable|string',
            'budget_from' => 'nullable|numeric|min:0',
            'budget_to' => 'nullable|numeric|min:0',
            'target_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $jobRequisition->update($request->all());

        return $this->success($jobRequisition, 'Job requisition updated successfully');
    }

    public function destroy(JobRequisition $jobRequisition)
    {
        if ($jobRequisition->status === 'approved') {
            return $this->error('Cannot delete approved requisition', 400);
        }

        $jobRequisition->delete();

        return $this->noContent('Job requisition deleted successfully');
    }

    public function approve(Request $request, JobRequisition $jobRequisition)
    {
        if ($jobRequisition->status !== 'pending') {
            return $this->error('Only pending requisitions can be approved', 400);
        }

        $jobRequisition->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return $this->success($jobRequisition, 'Job requisition approved successfully');
    }

    public function reject(Request $request, JobRequisition $jobRequisition)
    {
        if ($jobRequisition->status !== 'pending') {
            return $this->error('Only pending requisitions can be rejected', 400);
        }

        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $jobRequisition->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'rejection_reason' => $request->rejection_reason,
        ]);

        return $this->success($jobRequisition, 'Job requisition rejected');
    }

    public function pending()
    {
        $pending = JobRequisition::pending()
            ->with(['division', 'jobTitle', 'requester'])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();

        return $this->success($pending);
    }
}
