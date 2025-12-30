<?php

namespace App\Http\Controllers\Api\Company;

use App\Http\Controllers\Controller;
use App\Models\CompanyHoliday;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CompanyHolidayController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = CompanyHoliday::query();

        if ($request->filled('year')) {
            $query->forYear($request->year);
        }
        if ($request->filled('month')) {
            $query->forMonth($request->month);
        }
        if ($request->boolean('upcoming_only', false)) {
            $query->upcoming();
        }

        $holidays = $request->boolean('paginate', true)
            ? $query->orderBy('holiday_date')->paginate($request->input('per_page', 15))
            : $query->orderBy('holiday_date')->get();

        return $this->success($holidays);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'holiday_date' => 'required|date',
            'notes' => 'nullable|string',
            'is_recurring' => 'boolean',
        ]);

        $holiday = CompanyHoliday::create($validated);

        return $this->created($holiday, 'Company holiday created');
    }

    public function show(CompanyHoliday $companyHoliday)
    {
        return $this->success($companyHoliday);
    }

    public function update(Request $request, CompanyHoliday $companyHoliday)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'holiday_date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
            'is_recurring' => 'boolean',
        ]);

        $companyHoliday->update($validated);

        return $this->success($companyHoliday->fresh(), 'Company holiday updated');
    }

    public function destroy(CompanyHoliday $companyHoliday)
    {
        $companyHoliday->delete();

        return $this->noContent('Company holiday deleted');
    }

    /**
     * Bulk import holidays.
     */
    public function bulkImport(Request $request)
    {
        $validated = $request->validate([
            'holidays' => 'required|array',
            'holidays.*.title' => 'required|string|max:255',
            'holidays.*.holiday_date' => 'required|date',
            'holidays.*.notes' => 'nullable|string',
            'holidays.*.is_recurring' => 'boolean',
        ]);

        $created = [];
        foreach ($validated['holidays'] as $holidayData) {
            $created[] = CompanyHoliday::create($holidayData);
        }

        return $this->created($created, count($created).' holidays imported');
    }
}
