<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\ApplicationNote;
use App\Models\Job;
use App\Models\JobStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobApplicationController extends Controller
{
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

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    public function store(Request $request, Job $job)
    {
        $validator = Validator::make($request->all(), [
            'candidate_id' => 'required|exists:candidates,id',
            'custom_answers' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if already applied
        $existing = JobApplication::where('job_posting_id', $job->id)
            ->where('candidate_id', $request->candidate_id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Candidate has already applied for this job'
            ], 400);
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

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully',
            'data' => $application->load(['job', 'candidate', 'stage'])
        ], 201);
    }

    public function show(JobApplication $jobApplication)
    {
        $jobApplication->load(['job', 'candidate', 'stage', 'interviews', 'applicationNotes.user']);
        return response()->json([
            'success' => true,
            'data' => $jobApplication
        ]);
    }

    public function moveStage(Request $request, JobApplication $jobApplication)
    {
        $validator = Validator::make($request->all(), [
            'job_stage_id' => 'required|exists:job_stages,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $jobApplication->update(['job_stage_id' => $request->job_stage_id]);

        return response()->json([
            'success' => true,
            'message' => 'Application moved to new stage',
            'data' => $jobApplication->load('stage')
        ]);
    }

    public function rate(Request $request, JobApplication $jobApplication)
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $jobApplication->update([
            'rating' => $request->rating,
            'notes' => $request->notes ?? $jobApplication->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Application rated successfully',
            'data' => $jobApplication
        ]);
    }

    public function addNote(Request $request, JobApplication $jobApplication)
    {
        $validator = Validator::make($request->all(), [
            'note' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $note = ApplicationNote::create([
            'job_application_id' => $jobApplication->id,
            'user_id' => auth()->id(),
            'note' => $request->note,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Note added successfully',
            'data' => $note->load('user')
        ]);
    }

    public function shortlist(JobApplication $jobApplication)
    {
        $jobApplication->update(['status' => 'shortlisted']);

        return response()->json([
            'success' => true,
            'message' => 'Candidate shortlisted',
            'data' => $jobApplication
        ]);
    }

    public function reject(JobApplication $jobApplication)
    {
        $jobApplication->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Application rejected',
            'data' => $jobApplication
        ]);
    }

    public function hire(JobApplication $jobApplication)
    {
        $jobApplication->update(['status' => 'hired']);
        $jobApplication->candidate->update(['status' => 'hired']);

        return response()->json([
            'success' => true,
            'message' => 'Candidate hired successfully',
            'data' => $jobApplication
        ]);
    }
}
