<?php

namespace App\Http\Controllers\Api\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShiftController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $shifts = Shift::withCount('assignments')->get();

        return $this->success($shifts);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'break_duration_minutes' => 'nullable|integer|min:0',
            'color' => 'nullable|string|max:20',
            'is_night_shift' => 'nullable|boolean',
            'overtime_after_hours' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $shift = Shift::create($request->all());

        return $this->created($shift, 'Shift created');
    }

    public function show(Shift $shift)
    {
        $shift->load('assignments.staffMember');

        return $this->success($shift);
    }

    public function update(Request $request, Shift $shift)
    {
        $shift->update($request->all());

        return $this->success($shift, 'Updated');
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();

        return $this->noContent('Deleted');
    }

    public function assign(Request $request, Shift $shift)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_id' => 'required|exists:staff_members,id',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $assignment = ShiftAssignment::create([
            'shift_id' => $shift->id,
            'staff_member_id' => $request->staff_member_id,
            'effective_from' => $request->effective_from,
            'effective_to' => $request->effective_to,
        ]);

        return $this->success($assignment->load('staffMember'), 'Shift assigned');
    }

    public function roster(Request $request)
    {
        $query = ShiftAssignment::with(['shift', 'staffMember']);

        if ($request->date) {
            $query->where('effective_from', '<=', $request->date)
                ->where(function ($q) use ($request) {
                    $q->whereNull('effective_to')
                        ->orWhere('effective_to', '>=', $request->date);
                });
        }

        return $this->success($query->get());
    }

    public function employeeShifts($staffMemberId)
    {
        $assignments = ShiftAssignment::where('staff_member_id', $staffMemberId)
            ->with('shift')
            ->orderBy('effective_from', 'desc')
            ->get();

        return $this->success($assignments);
    }
}
