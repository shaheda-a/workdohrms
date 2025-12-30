<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\CandidateAssessment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CandidateAssessmentController extends Controller
{
    use ApiResponse;

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

        return $this->success($assessments);
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
            return $this->validationError($validator->errors());
        }

        $data = $request->all();
        $data['assessed_by'] = auth()->user()->staffMember?->id;
        $data['status'] = 'scheduled';

        $assessment = CandidateAssessment::create($data);

        return $this->created($assessment->load('candidate'), 'Assessment scheduled successfully');
    }

    public function show(CandidateAssessment $candidateAssessment)
    {
        $candidateAssessment->load(['candidate', 'jobApplication.job', 'assessor']);

        return $this->success($candidateAssessment);
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
            return $this->validationError($validator->errors());
        }

        $candidateAssessment->update($request->all());

        return $this->success($candidateAssessment, 'Assessment updated successfully');
    }

    public function destroy(CandidateAssessment $candidateAssessment)
    {
        $candidateAssessment->delete();

        return $this->noContent('Assessment deleted successfully');
    }

    public function complete(Request $request, CandidateAssessment $candidateAssessment)
    {
        $validator = Validator::make($request->all(), [
            'score' => 'required|numeric|min:0',
            'max_score' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $candidateAssessment->update([
            'score' => $request->score,
            'max_score' => $request->max_score,
            'notes' => $request->notes,
            'status' => 'completed',
            'assessed_by' => auth()->user()->staffMember?->id,
        ]);

        return $this->success($candidateAssessment, 'Assessment completed successfully');
    }

    public function cancel(CandidateAssessment $candidateAssessment)
    {
        if ($candidateAssessment->status === 'completed') {
            return $this->error('Cannot cancel completed assessment', 400);
        }

        $candidateAssessment->update(['status' => 'cancelled']);

        return $this->success($candidateAssessment, 'Assessment cancelled');
    }

    public function candidateAssessments($candidateId)
    {
        $assessments = CandidateAssessment::where('candidate_id', $candidateId)
            ->with(['jobApplication', 'assessor'])
            ->orderBy('assessment_date', 'desc')
            ->get();

        return $this->success($assessments);
    }
}
