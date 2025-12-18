<?php

namespace Database\Seeders;

use App\Models\OfficeLocation;
use App\Models\Division;
use App\Models\JobTitle;
use App\Models\StaffMember;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class SampleDataSeeder extends Seeder
{
    /**
     * Seed sample data for testing.
     */
    public function run(): void
    {
        // Create Office Locations (Branches)
        $headquarters = OfficeLocation::firstOrCreate(
            ['title' => 'Headquarters'],
            [
                'address' => '123 Corporate Drive, Bangalore, Karnataka 560001',
                'contact_phone' => '+91-80-12345678',
                'contact_email' => 'hq@company.com',
                'is_active' => true,
            ]
        );

        $mumbaiOffice = OfficeLocation::firstOrCreate(
            ['title' => 'Mumbai Office'],
            [
                'address' => '456 Business Park, Mumbai, Maharashtra 400001',
                'contact_phone' => '+91-22-98765432',
                'contact_email' => 'mumbai@company.com',
                'is_active' => true,
            ]
        );

        $delhiOffice = OfficeLocation::firstOrCreate(
            ['title' => 'Delhi Office'],
            [
                'address' => '789 Tech Hub, New Delhi, Delhi 110001',
                'contact_phone' => '+91-11-55556666',
                'contact_email' => 'delhi@company.com',
                'is_active' => true,
            ]
        );

        // Create Divisions (Departments)
        $engineering = Division::firstOrCreate(
            ['title' => 'Engineering'],
            [
                'office_location_id' => $headquarters->id,
                'notes' => 'Software Development and Engineering',
                'is_active' => true,
            ]
        );

        $hr = Division::firstOrCreate(
            ['title' => 'Human Resources'],
            [
                'office_location_id' => $headquarters->id,
                'notes' => 'HR and People Operations',
                'is_active' => true,
            ]
        );

        $sales = Division::firstOrCreate(
            ['title' => 'Sales & Marketing'],
            [
                'office_location_id' => $mumbaiOffice->id,
                'notes' => 'Sales and Marketing Operations',
                'is_active' => true,
            ]
        );

        $finance = Division::firstOrCreate(
            ['title' => 'Finance'],
            [
                'office_location_id' => $headquarters->id,
                'notes' => 'Finance and Accounting',
                'is_active' => true,
            ]
        );

        $operations = Division::firstOrCreate(
            ['title' => 'Operations'],
            [
                'office_location_id' => $delhiOffice->id,
                'notes' => 'Business Operations',
                'is_active' => true,
            ]
        );

        // Create Job Titles (Designations)
        $ceo = JobTitle::firstOrCreate(
            ['title' => 'Chief Executive Officer'],
            ['division_id' => $engineering->id, 'is_active' => true]
        );

        $cto = JobTitle::firstOrCreate(
            ['title' => 'Chief Technology Officer'],
            ['division_id' => $engineering->id, 'is_active' => true]
        );

        $hrDirector = JobTitle::firstOrCreate(
            ['title' => 'HR Director'],
            ['division_id' => $hr->id, 'is_active' => true]
        );

        $hrManager = JobTitle::firstOrCreate(
            ['title' => 'HR Manager'],
            ['division_id' => $hr->id, 'is_active' => true]
        );

        $seniorDev = JobTitle::firstOrCreate(
            ['title' => 'Senior Software Engineer'],
            ['division_id' => $engineering->id, 'is_active' => true]
        );

        $developer = JobTitle::firstOrCreate(
            ['title' => 'Software Engineer'],
            ['division_id' => $engineering->id, 'is_active' => true]
        );

        $juniorDev = JobTitle::firstOrCreate(
            ['title' => 'Junior Developer'],
            ['division_id' => $engineering->id, 'is_active' => true]
        );

        $salesManager = JobTitle::firstOrCreate(
            ['title' => 'Sales Manager'],
            ['division_id' => $sales->id, 'is_active' => true]
        );

        $accountant = JobTitle::firstOrCreate(
            ['title' => 'Senior Accountant'],
            ['division_id' => $finance->id, 'is_active' => true]
        );

        // Create Staff Members (Employees)
        $employees = [
            [
                'full_name' => 'Rajesh Kumar',
                'personal_email' => 'rajesh.kumar@company.com',
                'mobile_number' => '+91-9876543210',
                'office_location_id' => $headquarters->id,
                'division_id' => $engineering->id,
                'job_title_id' => $cto->id,
                'hire_date' => Carbon::now()->subYears(5),
                'employment_status' => 'active',
                'gender' => 'male',
                'birth_date' => '1985-06-15',
            ],
            [
                'full_name' => 'Priya Sharma',
                'personal_email' => 'priya.sharma@company.com',
                'mobile_number' => '+91-9876543211',
                'office_location_id' => $headquarters->id,
                'division_id' => $hr->id,
                'job_title_id' => $hrDirector->id,
                'hire_date' => Carbon::now()->subYears(4),
                'employment_status' => 'active',
                'gender' => 'female',
                'birth_date' => '1988-03-22',
            ],
            [
                'full_name' => 'Amit Patel',
                'personal_email' => 'amit.patel@company.com',
                'mobile_number' => '+91-9876543212',
                'office_location_id' => $headquarters->id,
                'division_id' => $engineering->id,
                'job_title_id' => $seniorDev->id,
                'hire_date' => Carbon::now()->subYears(3),
                'employment_status' => 'active',
                'gender' => 'male',
                'birth_date' => '1990-11-08',
            ],
            [
                'full_name' => 'Sneha Reddy',
                'personal_email' => 'sneha.reddy@company.com',
                'mobile_number' => '+91-9876543213',
                'office_location_id' => $headquarters->id,
                'division_id' => $engineering->id,
                'job_title_id' => $developer->id,
                'hire_date' => Carbon::now()->subYears(2),
                'employment_status' => 'active',
                'gender' => 'female',
                'birth_date' => '1993-07-19',
            ],
            [
                'full_name' => 'Vikram Singh',
                'personal_email' => 'vikram.singh@company.com',
                'mobile_number' => '+91-9876543214',
                'office_location_id' => $mumbaiOffice->id,
                'division_id' => $sales->id,
                'job_title_id' => $salesManager->id,
                'hire_date' => Carbon::now()->subYears(2)->subMonths(6),
                'employment_status' => 'active',
                'gender' => 'male',
                'birth_date' => '1987-12-03',
            ],
            [
                'full_name' => 'Ananya Gupta',
                'personal_email' => 'ananya.gupta@company.com',
                'mobile_number' => '+91-9876543215',
                'office_location_id' => $headquarters->id,
                'division_id' => $finance->id,
                'job_title_id' => $accountant->id,
                'hire_date' => Carbon::now()->subYears(1),
                'employment_status' => 'active',
                'gender' => 'female',
                'birth_date' => '1991-04-28',
            ],
            [
                'full_name' => 'Rahul Verma',
                'personal_email' => 'rahul.verma@company.com',
                'mobile_number' => '+91-9876543216',
                'office_location_id' => $headquarters->id,
                'division_id' => $engineering->id,
                'job_title_id' => $juniorDev->id,
                'hire_date' => Carbon::now()->subMonths(8),
                'employment_status' => 'active',
                'gender' => 'male',
                'birth_date' => '1996-09-14',
            ],
            [
                'full_name' => 'Meera Nair',
                'personal_email' => 'meera.nair@company.com',
                'mobile_number' => '+91-9876543217',
                'office_location_id' => $delhiOffice->id,
                'division_id' => $operations->id,
                'job_title_id' => $hrManager->id,
                'hire_date' => Carbon::now()->subMonths(6),
                'employment_status' => 'active',
                'gender' => 'female',
                'birth_date' => '1989-01-25',
            ],
            [
                'full_name' => 'Karthik Iyer',
                'personal_email' => 'karthik.iyer@company.com',
                'mobile_number' => '+91-9876543218',
                'office_location_id' => $headquarters->id,
                'division_id' => $engineering->id,
                'job_title_id' => $developer->id,
                'hire_date' => Carbon::now()->subMonths(4),
                'employment_status' => 'active',
                'gender' => 'male',
                'birth_date' => '1994-05-12',
            ],
            [
                'full_name' => 'Divya Joshi',
                'personal_email' => 'divya.joshi@company.com',
                'mobile_number' => '+91-9876543219',
                'office_location_id' => $headquarters->id,
                'division_id' => $hr->id,
                'job_title_id' => $hrManager->id,
                'hire_date' => Carbon::now()->subMonths(2),
                'employment_status' => 'active',
                'gender' => 'female',
                'birth_date' => '1992-08-30',
            ],
        ];

        foreach ($employees as $empData) {
            StaffMember::firstOrCreate(
                ['personal_email' => $empData['personal_email']],
                $empData
            );
        }

        $this->command->info('Sample data seeded successfully!');
        $this->command->info('Created: 3 Office Locations, 5 Divisions, 9 Job Titles, 10 Staff Members');
    }
}
