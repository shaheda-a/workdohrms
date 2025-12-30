<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use App\Models\CompanyHoliday;
use App\Models\DataImport;
use App\Models\StaffMember;
use App\Models\WorkLog;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DataImportController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = DataImport::with('author');

        if ($request->filled('import_type')) {
            $query->where('import_type', $request->import_type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $imports = $query->latest()->paginate($request->input('per_page', 15));

        return response()->json(['success' => true, 'data' => $imports]);
    }

    /**
     * Get sample template for import.
     */
    public function template(Request $request)
    {
        $type = $request->input('type', 'staff_members');

        $templates = [
            'staff_members' => [
                'columns' => ['first_name', 'last_name', 'personal_email', 'phone_number', 'date_of_birth', 'gender', 'hire_date', 'base_salary', 'office_location', 'division', 'job_title'],
                'sample' => [
                    ['John', 'Doe', 'john@example.com', '1234567890', '1990-01-15', 'male', '2024-01-01', '50000', 'Head Office', 'Engineering', 'Developer'],
                ],
            ],
            'work_logs' => [
                'columns' => ['staff_code', 'log_date', 'status', 'clock_in', 'clock_out'],
                'sample' => [
                    ['EMP001', '2024-12-16', 'present', '09:00', '18:00'],
                ],
            ],
            'company_holidays' => [
                'columns' => ['title', 'holiday_date', 'is_optional'],
                'sample' => [
                    ['New Year', '2025-01-01', 'no'],
                ],
            ],
        ];

        if (! isset($templates[$type])) {
            return response()->json([
                'success' => false,
                'message' => 'Unknown import type',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => $templates[$type],
        ]);
    }

    /**
     * Import staff members from uploaded file.
     */
    public function importStaffMembers(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->store('imports', 'public');

        $import = DataImport::create([
            'import_type' => 'staff_members',
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'status' => 'processing',
            'started_at' => now(),
            'author_id' => $request->user()->id,
        ]);

        // Process CSV (simplified - in production use a queue)
        $results = $this->processStaffCsv($path, $import);

        return response()->json([
            'success' => true,
            'message' => "Import completed: {$results['success']} succeeded, {$results['errors']} failed",
            'data' => $import->fresh(),
        ]);
    }

    /**
     * Import attendance from uploaded file.
     */
    public function importAttendance(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->store('imports', 'public');

        $import = DataImport::create([
            'import_type' => 'work_logs',
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'status' => 'processing',
            'started_at' => now(),
            'author_id' => $request->user()->id,
        ]);

        $results = $this->processAttendanceCsv($path, $import);

        return response()->json([
            'success' => true,
            'message' => "Import completed: {$results['success']} succeeded, {$results['errors']} failed",
            'data' => $import->fresh(),
        ]);
    }

    /**
     * Import holidays from uploaded file.
     */
    public function importHolidays(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx|max:5120',
        ]);

        $file = $request->file('file');
        $path = $file->store('imports', 'public');

        $import = DataImport::create([
            'import_type' => 'company_holidays',
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'status' => 'processing',
            'started_at' => now(),
            'author_id' => $request->user()->id,
        ]);

        $results = $this->processHolidayCsv($path, $import);

        return response()->json([
            'success' => true,
            'message' => "Import completed: {$results['success']} succeeded, {$results['errors']} failed",
            'data' => $import->fresh(),
        ]);
    }

    /**
     * Process staff CSV.
     */
    protected function processStaffCsv(string $path, DataImport $import): array
    {
        $fullPath = Storage::disk('public')->path($path);
        $handle = fopen($fullPath, 'r');
        $headers = fgetcsv($handle);

        $success = 0;
        $errors = 0;
        $errorDetails = [];
        $row = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            try {
                // Ensure data has same number of columns as headers
                if (count($data) !== count($headers)) {
                    // Pad or trim data to match headers
                    $data = array_pad(array_slice($data, 0, count($headers)), count($headers), '');
                }
                $mapped = array_combine($headers, $data);

                StaffMember::create([
                    'first_name' => $mapped['first_name'] ?? '',
                    'last_name' => $mapped['last_name'] ?? '',
                    'personal_email' => $mapped['personal_email'] ?? null,
                    'phone_number' => $mapped['phone_number'] ?? null,
                    'date_of_birth' => ! empty($mapped['date_of_birth']) ? Carbon::parse($mapped['date_of_birth']) : null,
                    'gender' => $mapped['gender'] ?? null,
                    'hire_date' => ! empty($mapped['hire_date']) ? Carbon::parse($mapped['hire_date']) : now(),
                    'base_salary' => $mapped['base_salary'] ?? 0,
                    'employment_status' => 'active',
                ]);
                $success++;
            } catch (\Exception $e) {
                $errors++;
                $errorDetails[] = "Row {$row}: ".$e->getMessage();
            }
        }

        fclose($handle);

        $import->update([
            'status' => 'completed',
            'total_rows' => $row - 1,
            'processed_rows' => $row - 1,
            'success_rows' => $success,
            'error_rows' => $errors,
            'errors' => $errorDetails,
            'completed_at' => now(),
        ]);

        return ['success' => $success, 'errors' => $errors];
    }

    /**
     * Process attendance CSV.
     */
    protected function processAttendanceCsv(string $path, DataImport $import): array
    {
        $fullPath = Storage::disk('public')->path($path);
        $handle = fopen($fullPath, 'r');
        $headers = fgetcsv($handle);

        $success = 0;
        $errors = 0;
        $errorDetails = [];
        $row = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            try {
                // Ensure data has same number of columns as headers
                if (count($data) !== count($headers)) {
                    // Pad or trim data to match headers
                    $data = array_pad(array_slice($data, 0, count($headers)), count($headers), '');
                }
                $mapped = array_combine($headers, $data);

                $staff = StaffMember::where('staff_code', $mapped['staff_code'])->first();
                if (! $staff) {
                    throw new \Exception("Staff not found: {$mapped['staff_code']}");
                }

                WorkLog::updateOrCreate(
                    [
                        'staff_member_id' => $staff->id,
                        'log_date' => $mapped['log_date'],
                    ],
                    [
                        'status' => $mapped['status'] ?? 'present',
                        'clock_in' => $mapped['clock_in'] ?? null,
                        'clock_out' => $mapped['clock_out'] ?? null,
                    ]
                );
                $success++;
            } catch (\Exception $e) {
                $errors++;
                $errorDetails[] = "Row {$row}: ".$e->getMessage();
            }
        }

        fclose($handle);

        $import->update([
            'status' => 'completed',
            'total_rows' => $row - 1,
            'processed_rows' => $row - 1,
            'success_rows' => $success,
            'error_rows' => $errors,
            'errors' => $errorDetails,
            'completed_at' => now(),
        ]);

        return ['success' => $success, 'errors' => $errors];
    }

    /**
     * Process holiday CSV.
     */
    protected function processHolidayCsv(string $path, DataImport $import): array
    {
        $fullPath = Storage::disk('public')->path($path);
        $handle = fopen($fullPath, 'r');
        $headers = fgetcsv($handle);

        $success = 0;
        $errors = 0;
        $errorDetails = [];
        $row = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row++;
            try {
                // Ensure data has same number of columns as headers
                if (count($data) !== count($headers)) {
                    // Pad or trim data to match headers
                    $data = array_pad(array_slice($data, 0, count($headers)), count($headers), '');
                }
                $mapped = array_combine($headers, $data);

                CompanyHoliday::updateOrCreate(
                    ['holiday_date' => $mapped['holiday_date']],
                    [
                        'title' => $mapped['title'],
                        'is_optional' => strtolower($mapped['is_optional'] ?? 'no') === 'yes',
                    ]
                );
                $success++;
            } catch (\Exception $e) {
                $errors++;
                $errorDetails[] = "Row {$row}: ".$e->getMessage();
            }
        }

        fclose($handle);

        $import->update([
            'status' => 'completed',
            'total_rows' => $row - 1,
            'processed_rows' => $row - 1,
            'success_rows' => $success,
            'error_rows' => $errors,
            'errors' => $errorDetails,
            'completed_at' => now(),
        ]);

        return ['success' => $success, 'errors' => $errors];
    }

    public function show(DataImport $dataImport)
    {
        return response()->json([
            'success' => true,
            'data' => array_merge($dataImport->load('author')->toArray(), [
                'progress_percentage' => $dataImport->progress_percentage,
            ]),
        ]);
    }
}
