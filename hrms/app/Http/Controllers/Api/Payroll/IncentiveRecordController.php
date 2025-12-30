<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\IncentiveRecord;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class IncentiveRecordController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = IncentiveRecord::with(['staffMember', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->forPeriod($request->start_date, $request->end_date);
        }

        $records = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($records);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'description' => 'required|string|max:255',
            'calculation_type' => 'required|in:fixed,percentage',
            'amount' => 'required|numeric|min:0',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ]);

        $validated['author_id'] = $request->user()->id;
        $record = IncentiveRecord::create($validated);

        return $this->created($record->load('staffMember'), 'Incentive record created');
    }

    public function show(IncentiveRecord $incentiveRecord)
    {
        return $this->success($incentiveRecord->load(['staffMember', 'author']));
    }

    public function update(Request $request, IncentiveRecord $incentiveRecord)
    {
        $validated = $request->validate([
            'description' => 'sometimes|required|string|max:255',
            'calculation_type' => 'sometimes|required|in:fixed,percentage',
            'amount' => 'sometimes|required|numeric|min:0',
            'period_start' => 'sometimes|required|date',
            'period_end' => 'sometimes|required|date',
        ]);

        $incentiveRecord->update($validated);

        return $this->success($incentiveRecord->fresh('staffMember'), 'Incentive record updated');
    }

    public function destroy(IncentiveRecord $incentiveRecord)
    {
        $incentiveRecord->delete();

        return $this->noContent('Incentive record deleted');
    }
}
