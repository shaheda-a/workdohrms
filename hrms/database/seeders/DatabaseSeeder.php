<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call(AccessSeeder::class);

        // Create Super Admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@hrms.local'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $admin->assignRole('administrator');

        // Create HR Manager user
        $hrManager = User::firstOrCreate(
            ['email' => 'hr@hrms.local'],
            [
                'name' => 'Sarah Johnson',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $hrManager->assignRole('hr_officer');

        // Create Department Head / Manager user
        $manager = User::firstOrCreate(
            ['email' => 'manager@hrms.local'],
            [
                'name' => 'Michael Chen',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $manager->assignRole('manager');

        // Create Accountant user
        $accountant = User::firstOrCreate(
            ['email' => 'accountant@hrms.local'],
            [
                'name' => 'Emily Davis',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $accountant->assignRole('staff_member');

        // Create Employee user
        $employee = User::firstOrCreate(
            ['email' => 'employee@hrms.local'],
            [
                'name' => 'John Smith',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $employee->assignRole('staff_member');
    }
}
