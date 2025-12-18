<?php

namespace App\Console\Commands;

use App\Models\StaffMember;
use App\Models\User;
use App\Models\OfficeLocation;
use App\Models\Division;
use App\Models\JobTitle;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SeedSampleEmployees extends Command
{
    protected $signature = 'seed:employees';
    protected $description = 'Seed sample employees into the database';

    public function handle()
    {
        $this->info('Seeding employees...');

        // Get the first location, division, and job title
        $location = OfficeLocation::first();
        $division = Division::first();
        $jobTitle = JobTitle::first();

        if (!$location || !$division || !$jobTitle) {
            $this->error('Please ensure office locations, divisions, and job titles exist first.');
            return 1;
        }

        $employees = [
            ['full_name' => 'Rajesh Kumar', 'email' => 'rajesh.kumar@company.com', 'gender' => 'male'],
            ['full_name' => 'Priya Sharma', 'email' => 'priya.sharma@company.com', 'gender' => 'female'],
            ['full_name' => 'Amit Patel', 'email' => 'amit.patel@company.com', 'gender' => 'male'],
            ['full_name' => 'Sneha Reddy', 'email' => 'sneha.reddy@company.com', 'gender' => 'female'],
            ['full_name' => 'Vikram Singh', 'email' => 'vikram.singh@company.com', 'gender' => 'male'],
            ['full_name' => 'Ananya Gupta', 'email' => 'ananya.gupta@company.com', 'gender' => 'female'],
            ['full_name' => 'Rahul Verma', 'email' => 'rahul.verma@company.com', 'gender' => 'male'],
            ['full_name' => 'Meera Nair', 'email' => 'meera.nair@company.com', 'gender' => 'female'],
            ['full_name' => 'Karthik Iyer', 'email' => 'karthik.iyer@company.com', 'gender' => 'male'],
            ['full_name' => 'Divya Joshi', 'email' => 'divya.joshi@company.com', 'gender' => 'female'],
        ];

        $created = 0;
        foreach ($employees as $index => $emp) {
            // Check if user already exists
            $user = User::where('email', $emp['email'])->first();
            
            if (!$user) {
                // Create user account first
                $user = User::create([
                    'name' => $emp['full_name'],
                    'email' => $emp['email'],
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]);
                $user->assignRole('staff_member');
            }

            // Check if staff member already exists for this user
            $existing = StaffMember::where('user_id', $user->id)->first();
            if (!$existing) {
                StaffMember::create([
                    'user_id' => $user->id,
                    'full_name' => $emp['full_name'],
                    'personal_email' => $emp['email'],
                    'gender' => $emp['gender'],
                    'mobile_number' => '+91-98765432' . str_pad($index, 2, '0', STR_PAD_LEFT),
                    'office_location_id' => $location->id,
                    'division_id' => $division->id,
                    'job_title_id' => $jobTitle->id,
                    'hire_date' => Carbon::now()->subMonths(rand(2, 60)),
                    'employment_status' => 'active',
                ]);
                $created++;
                $this->line("Created: {$emp['full_name']}");
            } else {
                $this->line("Exists: {$emp['full_name']}");
            }
        }

        $this->info("Done! Created {$created} employees.");
        return 0;
    }
}

