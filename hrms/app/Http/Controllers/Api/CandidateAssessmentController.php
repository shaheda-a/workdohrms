<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CandidateAssessment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CandidateAssessmentController extends Controller
{
    public function index(Request $request)
    {
        $query = CandidateAssessment::with(['candidate', 'jobApplication', 'assessor']);

        if ($request->candidate_id) {
            $query->where('candidate_id', $request->candidate_id);
        }

        if ($request->job_application_id) {
            $query->where('job_application_id', $request->job_application_id);
        }

        if ($request->assessment_type) {
            $query->where('assessment_type', $request->assessment_type);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $assessments = $query->orderBy('assessment_date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $assessments
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'candidate_id' => 'required|exists:candidates,id',
            'job_application_id' => 'nullable|exists:job_applications,id',
            'assessment_type' => 'required|in:technical,aptitude,personality,coding,language,other',
            'title' => 'required|string|max:255',
            'assessment_date' => 'required|date',
            'score' => 'nullable|numeric|min:0',
            'max_score' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['assessed_by'] = auth()->user()->staffMember?->id;
        $data['status'] = 'scheduled';

        $assessment = CandidateAssessment::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Assessment scheduled successfully',
            'data' => $assessment->load('candidate')
        ], 201);
    }

    public function show(CandidateAssessment $candidateAssessment)
    {
        $candidateAssessment->load(['candidate', 'jobApplication.job', 'assessor']);
        return response()->json([
            'success' => true,
            'data' => $candidateAssessment
        ]);
    }

    public function update(Request $request, CandidateAssessment $candidateAssessment)
    {
        $validator = Validator::make($request->all(), [
            'assessment_type' => 'sometimes|in:technical,aptitude,personality,coding,language,other',
            'title' => 'sometimes|required|string|max:255',
            'assessment_date' => 'sometimes|date',
            'score' => 'nullable|numeric|min:0',
            'max_score' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:scheduled,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $candidateAssessment->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Assessment updated successfully',
            'data' => $candidateAssessment
        ]);
    }

    public function destroy(CandidateAssessment $candidateAssessment)
    {
        $candidateAssessment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assessment deleted successfully'
        ]);
    }

    public function complete(Request $request, CandidateAssessment $candidateAssessment)
    {
        $validator = Validator::make($request->all(), [
            'score' => 'required|numeric|min:0',
            'max_score' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $candidateAssessment->update([
            'score' => $request->score,
            'max_score' => $request->max_score,
            'notes' => $request->notes,
            'status' => 'completed',
            'assessed_by' => auth()->user()->staffMember?->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment completed successfully',
            'data' => $candidateAssessment
        ]);
    }

    public function cancel(CandidateAssessment $candidateAssessment)
    {
        if ($candidateAssessment->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel completed assessment'
            ], 400);
        }

        $candidateAssessment->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Assessment cancelled',
            'data' => $candidateAssessment
        ]);
    }

    public function candidateAssessments($candidateId)
    {
        $assessments = CandidateAssessment::where('candidate_id', $candidateId)
            ->with(['jobApplication', 'assessor'])
            ->orderBy('assessment_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assessments
        ]);
    }
}
