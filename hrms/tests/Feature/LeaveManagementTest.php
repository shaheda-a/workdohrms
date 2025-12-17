<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\StaffMember;
use App\Models\TimeOffCategory;
use App\Models\TimeOffRequest;
use App\Models\OfficeLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;
    protected StaffMember $staff;
    protected TimeOffCategory $category;

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

        $this->category = TimeOffCategory::create([
            'title' => 'Annual Leave',
            'annual_allowance' => 20,
            'is_paid' => true,
        ]);
    }

    public function test_can_list_time_off_categories(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/time-off-categories');

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data']);
    }

    public function test_can_create_leave_request(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/time-off-requests', [
                'staff_member_id' => $this->staff->id,
                'time_off_category_id' => $this->category->id,
                'start_date' => now()->addDays(10)->toDateString(),
                'end_date' => now()->addDays(12)->toDateString(),
                'reason' => 'Family vacation',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'approval_status', 'total_days'],
            ]);
    }

    public function test_can_approve_leave_request(): void
    {
        $request = TimeOffRequest::create([
            'staff_member_id' => $this->staff->id,
            'time_off_category_id' => $this->category->id,
            'start_date' => now()->addDays(10),
            'end_date' => now()->addDays(12),
            'total_days' => 3,
            'reason' => 'Test',
            'approval_status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/time-off-requests/' . $request->id . '/process', [
                'action' => 'approved',
                'approval_remarks' => 'Approved',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('time_off_requests', [
            'id' => $request->id,
            'approval_status' => 'approved',
        ]);
    }

    public function test_can_decline_leave_request(): void
    {
        $request = TimeOffRequest::create([
            'staff_member_id' => $this->staff->id,
            'time_off_category_id' => $this->category->id,
            'start_date' => now()->addDays(10),
            'end_date' => now()->addDays(12),
            'total_days' => 3,
            'reason' => 'Test',
            'approval_status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/time-off-requests/' . $request->id . '/process', [
                'action' => 'declined',
                'approval_remarks' => 'Insufficient notice',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('time_off_requests', [
            'id' => $request->id,
            'approval_status' => 'declined',
        ]);
    }

    public function test_can_get_leave_balance(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/time-off-balance?staff_member_id=' . $this->staff->id);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data']);
    }

    public function test_validates_date_range(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/time-off-requests', [
                'staff_member_id' => $this->staff->id,
                'time_off_category_id' => $this->category->id,
                'start_date' => now()->addDays(15)->toDateString(),
                'end_date' => now()->addDays(10)->toDateString(), // End before start
                'reason' => 'Test',
            ]);

        $response->assertStatus(422);
    }
}
