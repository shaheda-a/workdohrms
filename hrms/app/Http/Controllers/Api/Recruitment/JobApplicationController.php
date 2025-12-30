<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\ApplicationNote;
use App\Models\Job;
use App\Models\JobApplication;
use App\Models\JobStage;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobApplicationController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = JobApplication::with(['job', 'candidate', 'stage']);

        if ($request->job_posting_id) {
            $query->where('job_posting_id', $request->job_posting_id);
        }
        if ($request->job_stage_id) {
            $query->where('job_stage_id', $request->job_stage_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        $applications = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return $this->success($applications);
    }

    public function store(Request $request, Job $job)
    {
        $validator = Validator::make($request->all(), [
            'candidate_id' => 'required|exists:candidates,id',
            'custom_answers' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // Check if already applied
        $existing = JobApplication::where('job_posting_id', $job->id)
            ->where('candidate_id', $request->candidate_id)
            ->first();

        if ($existing) {
            return $this->error('Candidate has already applied for this job', 400);
        }

        // Get default stage
        $defaultStage = JobStage::where('is_default', true)->first();

        $application = JobApplication::create([
            'job_posting_id' => $job->id,
            'candidate_id' => $request->candidate_id,
            'job_stage_id' => $defaultStage?->id,
            'applied_date' => now(),
            'custom_answers' => $request->custom_answers,
            'status' => 'pending',
        ]);

        return $this->created($application->load(['job', 'candidate', 'stage']), 'Application submitted successfully');

        return $this->success($jobApplication);
    }

    public function moveStage(Request $request, JobApplication $jobApplication)
    {
        $validator = Validator::make($request->all(), [
            'job_stage_id' => 'required|exists:job_stages,id',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $jobApplication->update(['job_stage_id' => $request->job_stage_id]);

        return $this->success($jobApplication->load('stage'), 'Application moved to new stage');
    }

    public function rate(Request $request, JobApplication $jobApplication)
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $jobApplication->update([
            'rating' => $request->rating,
            'notes' => $request->notes ?? $jobApplication->notes,
        ]);

        return $this->success($jobApplication, 'Application rated successfully');
    }

    public function addNote(Request $request, JobApplication $jobApplication)
    {
        $validator = Validator::make($request->all(), [
            'note' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $note = ApplicationNote::create([
            'job_application_id' => $jobApplication->id,
            'user_id' => auth()->id(),
            'note' => $request->note,
        ]);

        return $this->success($note->load('user'), 'Note added successfully');
    }

    public function shortlist(JobApplication $jobApplication)
    {
        $jobApplication->update(['status' => 'shortlisted']);

        return $this->success($jobApplication, 'Candidate shortlisted');
    }

    public function reject(JobApplication $jobApplication)
    {
        $jobApplication->update(['status' => 'rejected']);

        return $this->success($jobApplication, 'Application rejected');
    }

    public function hire(JobApplication $jobApplication)
    {
        $jobApplication->update(['status' => 'hired']);
        $jobApplication->candidate->update(['status' => 'hired']);

        return $this->success($jobApplication, 'Candidate hired successfully');
    }
}
