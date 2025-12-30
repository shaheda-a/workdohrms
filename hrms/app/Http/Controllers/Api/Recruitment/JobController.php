<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\CustomQuestion;
use App\Models\Job;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JobController extends Controller
{
    use ApiResponse;

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

        return $this->success($jobs);
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
            return $this->validationError($validator->errors());
        }

        $job = Job::create($request->all());

        return $this->created($job->load(['category', 'officeLocation', 'division']), 'Job created successfully');

        return $this->success($job);
    }

    public function update(Request $request, Job $job)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'status' => 'nullable|in:draft,open,closed,on_hold',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $job->update($request->all());

        return $this->success($job->load(['category', 'officeLocation', 'division']), 'Job updated successfully');
    }

    public function destroy(Job $job)
    {
        $job->delete();

        return $this->noContent('Job deleted successfully');
    }

    public function publish(Job $job)
    {
        $job->update(['status' => 'open']);

        return $this->success($job, 'Job published successfully');
    }

    public function close(Job $job)
    {
        $job->update(['status' => 'closed']);

        return $this->success($job, 'Job closed successfully');
    }

    public function questions(Job $job)
    {
        return $this->success($job->customQuestions()->orderBy('order')->get());
    }

    public function addQuestion(Request $request, Job $job)
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string',
            'is_required' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $maxOrder = $job->customQuestions()->max('order') ?? 0;

        $question = CustomQuestion::create([
            'job_posting_id' => $job->id,
            'question' => $request->question,
            'is_required' => $request->is_required ?? false,
            'order' => $maxOrder + 1,
        ]);

        return $this->created($question, 'Question added successfully');
    }
}
