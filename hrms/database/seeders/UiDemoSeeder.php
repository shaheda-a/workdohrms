<?php

namespace Database\Seeders;

use App\Models\CompanyHoliday;
use App\Models\CompanyNotice;
use App\Models\Division;
use App\Models\JobTitle;
use App\Models\OfficeLocation;
use App\Models\StaffMember;
use App\Models\TimeOffCategory;
use App\Models\TimeOffRequest;
use App\Models\User;
use App\Models\WorkLog;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UiDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding UI demo data...');

        // Create demo users for each role
        $adminUser = User::where('email', 'admin@hrms.local')->first();
        if (! $adminUser) {
            $adminUser = User::create([
                'name' => 'Admin User',
                'email' => 'admin@hrms.local',
                'password' => Hash::make('password'),
            ]);
            $adminUser->assignRole('administrator');
        }

        // HR Officer demo account
        $hrUser = User::where('email', 'hr@hrms.local')->first();
        if (! $hrUser) {
            $hrUser = User::create([
                'name' => 'HR Officer',
                'email' => 'hr@hrms.local',
                'password' => Hash::make('password'),
            ]);
            $hrUser->assignRole('hr_officer');
        }

        // Manager demo account
        $managerUser = User::where('email', 'manager@hrms.local')->first();
        if (! $managerUser) {
            $managerUser = User::create([
                'name' => 'Team Manager',
                'email' => 'manager@hrms.local',
                'password' => Hash::make('password'),
            ]);
            $managerUser->assignRole('manager');
        }

        // Staff Member demo account
        $staffUser = User::where('email', 'staff@hrms.local')->first();
        if (! $staffUser) {
            $staffUser = User::create([
                'name' => 'Staff Member',
                'email' => 'staff@hrms.local',
                'password' => Hash::make('password'),
            ]);
            $staffUser->assignRole('staff_member');
        }

        $headquarters = OfficeLocation::firstOrCreate(
            ['title' => 'Headquarters'],
            [
                'address' => '123 Corporate Drive, San Francisco, CA 94102',
                'contact_phone' => '+1-415-555-0100',
                'contact_email' => 'hq@company.com',
                'is_active' => true,
            ]
        );

        $nyOffice = OfficeLocation::firstOrCreate(
            ['title' => 'New York Office'],
            [
                'address' => '456 Madison Ave, New York, NY 10022',
                'contact_phone' => '+1-212-555-0200',
                'contact_email' => 'ny@company.com',
                'is_active' => true,
            ]
        );

        $londonOffice = OfficeLocation::firstOrCreate(
            ['title' => 'London Office'],
            [
                'address' => '789 Oxford Street, London W1D 2HG',
                'contact_phone' => '+44-20-7946-0300',
                'contact_email' => 'london@company.com',
                'is_active' => true,
            ]
        );

        $engineering = Division::firstOrCreate(
            ['title' => 'Engineering'],
            ['office_location_id' => $headquarters->id, 'is_active' => true]
        );

        $hr = Division::firstOrCreate(
            ['title' => 'Human Resources'],
            ['office_location_id' => $headquarters->id, 'is_active' => true]
        );

        $sales = Division::firstOrCreate(
            ['title' => 'Sales & Marketing'],
            ['office_location_id' => $nyOffice->id, 'is_active' => true]
        );

        $finance = Division::firstOrCreate(
            ['title' => 'Finance'],
            ['office_location_id' => $headquarters->id, 'is_active' => true]
        );

        $operations = Division::firstOrCreate(
            ['title' => 'Operations'],
            ['office_location_id' => $londonOffice->id, 'is_active' => true]
        );

        $cto = JobTitle::firstOrCreate(['title' => 'Chief Technology Officer'], ['division_id' => $engineering->id, 'is_active' => true]);
        $seniorDev = JobTitle::firstOrCreate(['title' => 'Senior Software Engineer'], ['division_id' => $engineering->id, 'is_active' => true]);
        $developer = JobTitle::firstOrCreate(['title' => 'Software Engineer'], ['division_id' => $engineering->id, 'is_active' => true]);
        $juniorDev = JobTitle::firstOrCreate(['title' => 'Junior Developer'], ['division_id' => $engineering->id, 'is_active' => true]);
        $hrDirector = JobTitle::firstOrCreate(['title' => 'HR Director'], ['division_id' => $hr->id, 'is_active' => true]);
        $hrManager = JobTitle::firstOrCreate(['title' => 'HR Manager'], ['division_id' => $hr->id, 'is_active' => true]);
        $salesManager = JobTitle::firstOrCreate(['title' => 'Sales Manager'], ['division_id' => $sales->id, 'is_active' => true]);
        $accountant = JobTitle::firstOrCreate(['title' => 'Senior Accountant'], ['division_id' => $finance->id, 'is_active' => true]);
        $opsManager = JobTitle::firstOrCreate(['title' => 'Operations Manager'], ['division_id' => $operations->id, 'is_active' => true]);

        TimeOffCategory::firstOrCreate(['title' => 'Annual Leave'], ['annual_quota' => 20, 'is_paid' => true, 'is_active' => true]);
        TimeOffCategory::firstOrCreate(['title' => 'Sick Leave'], ['annual_quota' => 10, 'is_paid' => true, 'is_active' => true]);
        TimeOffCategory::firstOrCreate(['title' => 'Personal Leave'], ['annual_quota' => 5, 'is_paid' => true, 'is_active' => true]);
        TimeOffCategory::firstOrCreate(['title' => 'Unpaid Leave'], ['annual_quota' => 30, 'is_paid' => false, 'is_active' => true]);
        TimeOffCategory::firstOrCreate(['title' => 'Maternity Leave'], ['annual_quota' => 90, 'is_paid' => true, 'is_active' => true]);
        TimeOffCategory::firstOrCreate(['title' => 'Paternity Leave'], ['annual_quota' => 14, 'is_paid' => true, 'is_active' => true]);

        $holidays = [
            ['title' => "New Year's Day", 'holiday_date' => '2025-01-01'],
            ['title' => 'Martin Luther King Jr. Day', 'holiday_date' => '2025-01-20'],
            ['title' => "Presidents' Day", 'holiday_date' => '2025-02-17'],
            ['title' => 'Memorial Day', 'holiday_date' => '2025-05-26'],
            ['title' => 'Independence Day', 'holiday_date' => '2025-07-04'],
            ['title' => 'Labor Day', 'holiday_date' => '2025-09-01'],
            ['title' => 'Thanksgiving Day', 'holiday_date' => '2025-11-27'],
            ['title' => 'Christmas Day', 'holiday_date' => '2025-12-25'],
        ];

        foreach ($holidays as $h) {
            CompanyHoliday::firstOrCreate(['title' => $h['title']], $h);
        }

        $employees = [
            ['name' => 'Alex Chen', 'email' => 'alex.chen@company.com', 'role' => 'manager', 'job' => $cto, 'division' => $engineering, 'location' => $headquarters, 'salary' => 180000, 'gender' => 'male', 'years' => 5],
            ['name' => 'Sarah Johnson', 'email' => 'sarah.j@company.com', 'role' => 'hr_officer', 'job' => $hrDirector, 'division' => $hr, 'location' => $headquarters, 'salary' => 120000, 'gender' => 'female', 'years' => 4],
            ['name' => 'Michael Williams', 'email' => 'm.williams@company.com', 'role' => 'manager', 'job' => $seniorDev, 'division' => $engineering, 'location' => $headquarters, 'salary' => 140000, 'gender' => 'male', 'years' => 3],
            ['name' => 'Emily Brown', 'email' => 'emily.b@company.com', 'role' => 'staff_member', 'job' => $developer, 'division' => $engineering, 'location' => $headquarters, 'salary' => 95000, 'gender' => 'female', 'years' => 2],
            ['name' => 'David Lee', 'email' => 'd.lee@company.com', 'role' => 'staff_member', 'job' => $developer, 'division' => $engineering, 'location' => $nyOffice, 'salary' => 90000, 'gender' => 'male', 'years' => 2],
            ['name' => 'Jessica Martinez', 'email' => 'j.martinez@company.com', 'role' => 'staff_member', 'job' => $juniorDev, 'division' => $engineering, 'location' => $headquarters, 'salary' => 65000, 'gender' => 'female', 'years' => 1],
            ['name' => 'Robert Taylor', 'email' => 'r.taylor@company.com', 'role' => 'manager', 'job' => $salesManager, 'division' => $sales, 'location' => $nyOffice, 'salary' => 110000, 'gender' => 'male', 'years' => 3],
            ['name' => 'Amanda Wilson', 'email' => 'a.wilson@company.com', 'role' => 'hr_officer', 'job' => $hrManager, 'division' => $hr, 'location' => $headquarters, 'salary' => 85000, 'gender' => 'female', 'years' => 2],
            ['name' => 'James Anderson', 'email' => 'j.anderson@company.com', 'role' => 'staff_member', 'job' => $accountant, 'division' => $finance, 'location' => $headquarters, 'salary' => 95000, 'gender' => 'male', 'years' => 4],
            ['name' => 'Olivia Thomas', 'email' => 'o.thomas@company.com', 'role' => 'manager', 'job' => $opsManager, 'division' => $operations, 'location' => $londonOffice, 'salary' => 100000, 'gender' => 'female', 'years' => 3],
            ['name' => 'Daniel Garcia', 'email' => 'd.garcia@company.com', 'role' => 'staff_member', 'job' => $developer, 'division' => $engineering, 'location' => $londonOffice, 'salary' => 88000, 'gender' => 'male', 'years' => 1],
            ['name' => 'Sophia Rodriguez', 'email' => 's.rodriguez@company.com', 'role' => 'staff_member', 'job' => $juniorDev, 'division' => $engineering, 'location' => $headquarters, 'salary' => 62000, 'gender' => 'female', 'years' => 0],
        ];

        $staffMembers = [];
        foreach ($employees as $emp) {
            $user = User::firstOrCreate(
                ['email' => $emp['email']],
                ['name' => $emp['name'], 'password' => Hash::make('password')]
            );
            $user->assignRole($emp['role']);

            $nameParts = explode(' ', $emp['name']);
            $staff = StaffMember::firstOrCreate(
                ['personal_email' => $emp['email']],
                [
                    'user_id' => $user->id,
                    'full_name' => $emp['name'],
                    'mobile_number' => '+1-555-'.str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                    'gender' => $emp['gender'],
                    'birth_date' => Carbon::now()->subYears(rand(25, 45))->subDays(rand(0, 365)),
                    'office_location_id' => $emp['location']->id,
                    'division_id' => $emp['division']->id,
                    'job_title_id' => $emp['job']->id,
                    'hire_date' => Carbon::now()->subYears($emp['years'])->subMonths(rand(0, 11)),
                    'base_salary' => $emp['salary'],
                    'employment_status' => 'active',
                    'compensation_type' => 'monthly',
                ]
            );
            $staffMembers[] = $staff;
        }

        $today = Carbon::today();
        foreach ($staffMembers as $staff) {
            for ($i = 30; $i >= 0; $i--) {
                $date = $today->copy()->subDays($i);
                if ($date->isWeekend()) {
                    continue;
                }

                $statuses = ['present', 'present', 'present', 'present', 'present', 'present', 'absent', 'half_day'];
                $status = $statuses[array_rand($statuses)];

                WorkLog::firstOrCreate(
                    ['staff_member_id' => $staff->id, 'log_date' => $date->toDateString()],
                    [
                        'status' => $status,
                        'clock_in' => $status !== 'absent' ? '09:'.str_pad(rand(0, 15), 2, '0', STR_PAD_LEFT) : null,
                        'clock_out' => $status === 'present' ? '18:'.str_pad(rand(0, 30), 2, '0', STR_PAD_LEFT) : ($status === 'half_day' ? '13:00' : null),
                        'late_minutes' => $status !== 'absent' ? rand(0, 20) : 0,
                    ]
                );
            }
        }

        $annualLeave = TimeOffCategory::where('title', 'Annual Leave')->first();
        $sickLeave = TimeOffCategory::where('title', 'Sick Leave')->first();

        if ($annualLeave && count($staffMembers) > 3) {
            TimeOffRequest::firstOrCreate(
                ['staff_member_id' => $staffMembers[3]->id, 'start_date' => Carbon::now()->addDays(7)->toDateString()],
                [
                    'time_off_category_id' => $annualLeave->id,
                    'end_date' => Carbon::now()->addDays(11)->toDateString(),
                    'total_days' => 5,
                    'reason' => 'Family vacation',
                    'approval_status' => 'pending',
                    'request_date' => Carbon::now()->toDateString(),
                ]
            );

            TimeOffRequest::firstOrCreate(
                ['staff_member_id' => $staffMembers[5]->id, 'start_date' => Carbon::now()->subDays(5)->toDateString()],
                [
                    'time_off_category_id' => $sickLeave->id,
                    'end_date' => Carbon::now()->subDays(4)->toDateString(),
                    'total_days' => 2,
                    'reason' => 'Medical appointment',
                    'approval_status' => 'approved',
                    'request_date' => Carbon::now()->subDays(7)->toDateString(),
                ]
            );

            TimeOffRequest::firstOrCreate(
                ['staff_member_id' => $staffMembers[6]->id, 'start_date' => Carbon::now()->addDays(14)->toDateString()],
                [
                    'time_off_category_id' => $annualLeave->id,
                    'end_date' => Carbon::now()->addDays(21)->toDateString(),
                    'total_days' => 6,
                    'reason' => 'Holiday trip',
                    'approval_status' => 'pending',
                    'request_date' => Carbon::now()->toDateString(),
                ]
            );
        }

        CompanyNotice::firstOrCreate(
            ['title' => 'Welcome to the New HRMS'],
            [
                'content' => 'We are excited to announce the launch of our new Human Resource Management System.',
                'publish_date' => now(),
                'is_company_wide' => true,
            ]
        );

        CompanyNotice::firstOrCreate(
            ['title' => 'Q4 Performance Reviews'],
            [
                'content' => 'Please complete your Q4 self-assessments by December 31st.',
                'publish_date' => now(),
                'is_company_wide' => true,
            ]
        );

        $this->command->info('UI demo data seeded successfully!');
        $this->command->info('Created: 3 Locations, 5 Divisions, 9 Job Titles, 12 Staff Members, Attendance logs, Leave requests, Events');
        $this->command->info('Login credentials: admin@hrms.local / password (or any employee email / password)');
    }
}
