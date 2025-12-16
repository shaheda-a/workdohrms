<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExtraHoursRecord;
use Illuminate\Http\Request;

class ExtraHoursRecordController extends Controller
{
    public function index(Request $request)
    {
        $query = ExtraHoursRecord::with(['staffMember', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->where(function ($q) use ($request) {
                $q->whereBetween('period_start', [$request->start_date, $request->end_date])
                    ->orWhereBetween('period_end', [$request->start_date, $request->end_date]);
            });
        }

        $records = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        // Add total_amount to each record
        $records->getCollection()->transform(function ($item) {
            $item->total_amount = $item->total_amount;
            return $item;
        });

        return response()->json(['success' => true, 'data' => $records]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'title' => 'required|string|max:255',
            'days_count' => 'required|integer|min:1',
            'hours_per_day' => 'required|numeric|min:0',
            'hourly_rate' => 'required|numeric|min:0',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'notes' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $record = ExtraHoursRecord::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Extra hours record created',
            'data' => array_merge($record->load('staffMember')->toArray(), [
                'total_amount' => $record->total_amount
            ]),
        ], 201);
    }

    public function show(ExtraHoursRecord $extraHoursRecord)
    {
        return response()->json([
            'success' => true,
            'data' => array_merge($extraHoursRecord->load(['staffMember', 'author'])->toArray(), [
                'total_amount' => $extraHoursRecord->total_amount
            ]),
        ]);
    }

    public function update(Request $request, ExtraHoursRecord $extraHoursRecord)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'days_count' => 'sometimes|required|integer|min:1',
            'hours_per_day' => 'sometimes|required|numeric|min:0',
            'hourly_rate' => 'sometimes|required|numeric|min:0',
            'period_start' => 'sometimes|required|date',
            'period_end' => 'sometimes|required|date',
            'notes' => 'nullable|string',
        ]);

        $extraHoursRecord->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Extra hours record updated',
            'data' => array_merge($extraHoursRecord->fresh('staffMember')->toArray(), [
                'total_amount' => $extraHoursRecord->fresh()->total_amount
            ]),
        ]);
    }

    public function destroy(ExtraHoursRecord $extraHoursRecord)
    {
        $extraHoursRecord->delete();

        return response()->json([
            'success' => true,
            'message' => 'Extra hours record deleted',
        ]);
    }
}
