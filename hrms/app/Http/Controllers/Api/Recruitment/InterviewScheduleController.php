<?php

namespace App\Http\Controllers\Api\Recruitment;

use App\Http\Controllers\Controller;
use App\Models\InterviewSchedule;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InterviewScheduleController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = InterviewSchedule::with(['application.candidate', 'application.job', 'interviewer']);

        if ($request->job_application_id) {
            $query->where('job_application_id', $request->job_application_id);
        }
        if ($request->interviewer_id) {
            $query->where('interviewer_id', $request->interviewer_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->date_from) {
            $query->where('scheduled_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->where('scheduled_date', '<=', $request->date_to);
        }

        $interviews = $request->paginate === 'false'
            ? $query->get()
            : $query->paginate($request->per_page ?? 15);

        return $this->success($interviews);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'job_application_id' => 'required|exists:job_applications,id',
            'interviewer_id' => 'nullable|exists:staff_members,id',
            'round_number' => 'nullable|integer|min:1',
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'required|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:15',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // Auto-calculate round number
        $lastRound = InterviewSchedule::where('job_application_id', $request->job_application_id)
            ->max('round_number') ?? 0;

        $data = $request->all();
        $data['round_number'] = $request->round_number ?? ($lastRound + 1);
        $data['status'] = 'scheduled';

        $interview = InterviewSchedule::create($data);

        // Update candidate status
        $interview->application->candidate->update(['status' => 'interview']);

        return $this->created($interview->load(['application.candidate', 'interviewer']), 'Interview scheduled successfully');

        return $this->success($interviewSchedule);
    }

    public function update(Request $request, InterviewSchedule $interviewSchedule)
    {
        $validator = Validator::make($request->all(), [
            'scheduled_date' => 'sometimes|required|date',
            'scheduled_time' => 'sometimes|required|date_format:H:i',
            'status' => 'nullable|in:scheduled,completed,cancelled,rescheduled',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $interviewSchedule->update($request->all());

        return $this->success($interviewSchedule, 'Interview updated successfully');
    }

    public function destroy(InterviewSchedule $interviewSchedule)
    {
        $interviewSchedule->delete();

        return $this->noContent('Interview deleted successfully');
    }

    public function feedback(Request $request, InterviewSchedule $interviewSchedule)
    {
        $validator = Validator::make($request->all(), [
            'feedback' => 'required|string',
            'rating' => 'nullable|integer|min:1|max:5',
            'recommendation' => 'nullable|in:proceed,hold,reject',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $interviewSchedule->update([
            'feedback' => $request->feedback,
            'rating' => $request->rating,
            'recommendation' => $request->recommendation,
            'status' => 'completed',
        ]);

        return $this->success($interviewSchedule, 'Feedback submitted successfully');
    }

    public function reschedule(Request $request, InterviewSchedule $interviewSchedule)
    {
        $validator = Validator::make($request->all(), [
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $interviewSchedule->update([
            'scheduled_date' => $request->scheduled_date,
            'scheduled_time' => $request->scheduled_time,
            'notes' => $request->notes ?? $interviewSchedule->notes,
            'status' => 'rescheduled',
        ]);

        return $this->success($interviewSchedule, 'Interview rescheduled successfully');
    }

    public function calendar(Request $request)
    {
        $query = InterviewSchedule::with(['application.candidate', 'application.job', 'interviewer'])
            ->where('status', 'scheduled');

        if ($request->month && $request->year) {
            $query->whereMonth('scheduled_date', $request->month)
                ->whereYear('scheduled_date', $request->year);
        }

        $interviews = $query->get();

        return $this->success($interviews);
    }

    public function today()
    {
        $interviews = InterviewSchedule::with(['application.candidate', 'application.job', 'interviewer'])
            ->whereDate('scheduled_date', now())
            ->orderBy('scheduled_time')
            ->get();

        return $this->success($interviews);
    }
}
