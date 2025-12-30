<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\CompanyEvent;
use App\Models\CompanyHoliday;
use App\Models\TimeOffRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CompanyEventController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = CompanyEvent::with(['author', 'attendees']);

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->forDateRange($request->start_date, $request->end_date);
        }
        if ($request->boolean('upcoming_only', false)) {
            $query->upcoming();
        }

        $events = $request->boolean('paginate', true)
            ? $query->orderBy('event_start')->paginate($request->input('per_page', 15))
            : $query->orderBy('event_start')->get();

        return $this->success($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'event_start' => 'required|date',
            'event_end' => 'nullable|date|after_or_equal:event_start',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'is_all_day' => 'boolean',
            'is_company_wide' => 'boolean',
            'attendee_ids' => 'nullable|array',
            'attendee_ids.*' => 'exists:staff_members,id',
        ]);

        $validated['author_id'] = $request->user()->id;
        $event = CompanyEvent::create(collect($validated)->except('attendee_ids')->toArray());

        // Attach attendees if not company-wide
        if (! ($validated['is_company_wide'] ?? true) && ! empty($validated['attendee_ids'])) {
            $event->attendees()->attach($validated['attendee_ids']);
        }

        return $this->created($event->load('attendees'), 'Event created');
    }

    public function show(CompanyEvent $companyEvent)
    {
        return $this->success($companyEvent->load(['author', 'attendees']));
    }

    public function update(Request $request, CompanyEvent $companyEvent)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'event_start' => 'sometimes|required|date',
            'event_end' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'is_all_day' => 'boolean',
            'is_company_wide' => 'boolean',
            'attendee_ids' => 'nullable|array',
            'attendee_ids.*' => 'exists:staff_members,id',
        ]);

        $companyEvent->update(collect($validated)->except('attendee_ids')->toArray());

        if (isset($validated['attendee_ids'])) {
            $companyEvent->attendees()->sync($validated['attendee_ids']);
        }

        return $this->success($companyEvent->fresh(['author', 'attendees']), 'Event updated');
    }

    /**
     * RSVP to an event.
     */
    public function rsvp(Request $request, CompanyEvent $companyEvent)
    {
        $validated = $request->validate([
            'response' => 'required|in:accepted,declined,maybe',
        ]);

        $staffMember = \App\Models\StaffMember::where('user_id', $request->user()->id)->first();

        if (! $staffMember) {
            return $this->error('Staff member not found', 404);
        }

        $companyEvent->attendees()->syncWithoutDetaching([
            $staffMember->id => [
                'response' => $validated['response'],
                'responded_at' => now(),
            ],
        ]);

        return $this->noContent('RSVP recorded');
    }

    /**
     * Get calendar data (events, holidays, leaves).
     */
    public function calendarData(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $start = $request->start_date;
        $end = $request->end_date;

        // Events
        $events = CompanyEvent::forDateRange($start, $end)->get()->map(function ($e) {
            return [
                'id' => 'event_'.$e->id,
                'title' => $e->title,
                'start' => $e->event_start->toDateString(),
                'end' => $e->event_end?->toDateString(),
                'color' => $e->color,
                'type' => 'event',
            ];
        });

        // Holidays
        $holidays = CompanyHoliday::whereBetween('holiday_date', [$start, $end])
            ->get()->map(function ($h) {
                return [
                    'id' => 'holiday_'.$h->id,
                    'title' => $h->title,
                    'start' => $h->holiday_date->toDateString(),
                    'color' => '#dc2626',
                    'type' => 'holiday',
                ];
            });

        // Approved leaves
        $leaves = TimeOffRequest::approved()
            ->forPeriod($start, $end)
            ->with(['staffMember', 'category'])
            ->get()->map(function ($l) {
                return [
                    'id' => 'leave_'.$l->id,
                    'title' => $l->staffMember->full_name.' - '.$l->category->title,
                    'start' => $l->start_date->toDateString(),
                    'end' => $l->end_date->toDateString(),
                    'color' => '#f59e0b',
                    'type' => 'leave',
                ];
            });

        return $this->success($events->merge($holidays)->merge($leaves)->values());
    }

    public function destroy(CompanyEvent $companyEvent)
    {
        $companyEvent->delete();

        return $this->noContent('Event deleted');
    }
}
