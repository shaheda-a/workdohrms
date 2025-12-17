<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\StaffMember;
use App\Models\WorkLog;
use App\Models\OfficeLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected StaffMember $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\AccessSeeder']);
        
        $this->user = User::factory()->create();
        $this->user->assignRole('administrator');
        $this->token = $this->user->createToken('test-token')->plainTextToken;

        $location = OfficeLocation::create(['title' => 'Head Office']);
        $this->staff = StaffMember::create([
            'full_name' => 'Test Staff',
            'hire_date' => '2024-01-01',
            'office_location_id' => $location->id,
            'user_id' => $this->user->id,
        ]);
    }

    public function test_can_clock_in(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/clock-in');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('work_logs', [
            'staff_member_id' => $this->staff->id,
        ]);
    }

    public function test_can_create_work_log(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/work-logs', [
                'staff_member_id' => $this->staff->id,
                'log_date' => now()->subDays(5)->toDateString(),
                'status' => 'present',
                'clock_in' => '09:00',
                'clock_out' => '18:00',
            ]);

        $response->assertStatus(201);
    }

    public function test_can_get_attendance_summary(): void
    {
        // Create some attendance
        WorkLog::create([
            'staff_member_id' => $this->staff->id,
            'log_date' => now()->subDays(1)->toDateString(),
            'status' => 'present',
        ]);

        $startDate = now()->startOfMonth()->toDateString();
        $endDate = now()->endOfMonth()->toDateString();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/attendance-summary?staff_member_id=' . $this->staff->id . 
                      '&start_date=' . $startDate . '&end_date=' . $endDate);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
