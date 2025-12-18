<?php

namespace App\Services\Reports;

use App\Models\StaffMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Data Import Service
 *
 * Handles all business logic for data import functionality.
 */
class DataImportService
{
    /**
     * Import staff members from array data.
     */
    public function importStaffMembers(array $data, array $options = []): array
    {
        $imported = 0;
        $skipped = 0;
        $errors = [];

        DB::transaction(function () use ($data, $options, &$imported, &$skipped, &$errors) {
            foreach ($data as $index => $row) {
                try {
                    $email = $row['email'] ?? null;

                    if (! $email) {
                        $errors[] = "Row {$index}: Email is required";
                        $skipped++;

                        continue;
                    }

                    $existingUser = User::where('email', $email)->first();

                    if ($existingUser && ! ($options['update_existing'] ?? false)) {
                        $skipped++;

                        continue;
                    }

                    if ($existingUser) {
                        $user = $existingUser;
                    } else {
                        $user = User::create([
                            'name' => ($row['first_name'] ?? '').' '.($row['last_name'] ?? ''),
                            'email' => $email,
                            'password' => Hash::make($row['password'] ?? 'password123'),
                            'is_active' => true,
                        ]);
                        $user->assignRole('staff_member');
                    }

                    $staffMemberData = [
                        'user_id' => $user->id,
                        'first_name' => $row['first_name'] ?? '',
                        'last_name' => $row['last_name'] ?? '',
                        'email' => $email,
                        'phone' => $row['phone'] ?? null,
                        'employee_id' => $row['employee_id'] ?? $this->generateEmployeeId(),
                        'office_location_id' => $row['office_location_id'] ?? null,
                        'division_id' => $row['division_id'] ?? null,
                        'job_title_id' => $row['job_title_id'] ?? null,
                        'hire_date' => $row['hire_date'] ?? now()->toDateString(),
                        'base_salary' => $row['base_salary'] ?? 0,
                        'employment_status' => $row['employment_status'] ?? 'active',
                    ];

                    if ($existingUser && ($options['update_existing'] ?? false)) {
                        $staffMember = StaffMember::where('user_id', $user->id)->first();
                        if ($staffMember) {
                            $staffMember->update($staffMemberData);
                        } else {
                            StaffMember::create($staffMemberData);
                        }
                    } else {
                        StaffMember::create($staffMemberData);
                    }

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row {$index}: ".$e->getMessage();
                    $skipped++;
                }
            }
        });

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
            'total' => count($data),
        ];
    }

    /**
     * Validate import data.
     */
    public function validateImportData(array $data, string $type): array
    {
        $errors = [];
        $requiredFields = $this->getRequiredFields($type);

        foreach ($data as $index => $row) {
            foreach ($requiredFields as $field) {
                if (empty($row[$field])) {
                    $errors[] = "Row {$index}: Missing required field '{$field}'";
                }
            }
        }

        return $errors;
    }

    /**
     * Get required fields for import type.
     */
    protected function getRequiredFields(string $type): array
    {
        return match ($type) {
            'staff_members' => ['email', 'first_name', 'last_name'],
            'attendance' => ['employee_id', 'log_date', 'clock_in'],
            'leave_requests' => ['employee_id', 'start_date', 'end_date', 'time_off_category_id'],
            default => [],
        };
    }

    /**
     * Generate unique employee ID.
     */
    protected function generateEmployeeId(): string
    {
        $lastEmployee = StaffMember::orderBy('id', 'desc')->first();
        $nextId = $lastEmployee ? $lastEmployee->id + 1 : 1;

        return 'EMP'.str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Get import template headers.
     */
    public function getTemplateHeaders(string $type): array
    {
        return match ($type) {
            'staff_members' => [
                'first_name',
                'last_name',
                'email',
                'phone',
                'employee_id',
                'office_location_id',
                'division_id',
                'job_title_id',
                'hire_date',
                'base_salary',
                'employment_status',
            ],
            'attendance' => [
                'employee_id',
                'log_date',
                'clock_in',
                'clock_out',
                'status',
            ],
            'leave_requests' => [
                'employee_id',
                'time_off_category_id',
                'start_date',
                'end_date',
                'reason',
            ],
            default => [],
        };
    }
}
