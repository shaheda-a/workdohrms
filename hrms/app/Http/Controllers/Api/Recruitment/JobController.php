<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\CustomQuestion;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobController extends Controller
{
    public function index(Request $request)
    {
        $query = Job::with(['category', 'officeLocation', 'division'])
            ->withCount('applications');

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->job_category_id) {
            $query->where('job_category_id', $request->job_category_id);
        }
        if ($request->office_location_id) {
            $query->where('office_location_id', $request->office_location_id);
        }
        if ($request->search) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $jobs = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'job_category_id' => 'nullable|exists:job_categories,id',
            'office_location_id' => 'nullable|exists:office_locations,id',
            'division_id' => 'nullable|exists:divisions,id',
            'positions' => 'nullable|integer|min:1',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'skills' => 'nullable|string',
            'experience_required' => 'nullable|string|max:100',
            'salary_from' => 'nullable|numeric|min:0',
            'salary_to' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job = Job::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Job created successfully',
            'data' => $job->load(['category', 'officeLocation', 'division']),
        ], 201);
    }

    public function show(Job $job)
    {
        $job->load(['category', 'officeLocation', 'division', 'applications.candidate', 'customQuestions']);

        return response()->json([
            'success' => true,
            'data' => $job,
        ]);
    }

    public function update(Request $request, Job $job)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'status' => 'nullable|in:draft,open,closed,on_hold',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Job updated successfully',
            'data' => $job->load(['category', 'officeLocation', 'division']),
        ]);
    }

    public function destroy(Job $job)
    {
        $job->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job deleted successfully',
        ]);
    }

    public function publish(Job $job)
    {
        $job->update(['status' => 'open']);

        return response()->json([
            'success' => true,
            'message' => 'Job published successfully',
            'data' => $job,
        ]);
    }

    public function close(Job $job)
    {
        $job->update(['status' => 'closed']);

        return response()->json([
            'success' => true,
            'message' => 'Job closed successfully',
            'data' => $job,
        ]);
    }

    public function questions(Job $job)
    {
        return response()->json([
            'success' => true,
            'data' => $job->customQuestions()->orderBy('order')->get(),
        ]);
    }

    public function addQuestion(Request $request, Job $job)
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string',
            'is_required' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $maxOrder = $job->customQuestions()->max('order') ?? 0;

        $question = CustomQuestion::create([
            'job_posting_id' => $job->id,
            'question' => $request->question,
            'is_required' => $request->is_required ?? false,
            'order' => $maxOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Question added successfully',
            'data' => $question,
        ], 201);
    }
}
