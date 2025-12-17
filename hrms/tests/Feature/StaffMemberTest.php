<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\StaffMember;
use App\Models\OfficeLocation;
use App\Models\Division;
use App\Models\JobTitle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffMemberTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\AccessSeeder']);
        
        $this->user = User::factory()->create();
        $this->user->assignRole('administrator');
        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    protected function createOrganizationStructure(): array
    {
        $location = OfficeLocation::create(['title' => 'Head Office', 'city' => 'New York']);
        $division = Division::create(['title' => 'Engineering', 'office_location_id' => $location->id]);
        $jobTitle = JobTitle::create(['title' => 'Developer', 'division_id' => $division->id]);

        return compact('location', 'division', 'jobTitle');
    }

    public function test_can_list_staff_members(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/staff-members');

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data']);
    }

    public function test_can_create_staff_member(): void
    {
        $org = $this->createOrganizationStructure();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/staff-members', [
                'full_name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'hire_date' => '2024-01-15',
                'base_salary' => 75000,
                'office_location_id' => $org['location']->id,
                'division_id' => $org['division']->id,
                'job_title_id' => $org['jobTitle']->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'staff_code', 'full_name'],
            ]);

        $this->assertDatabaseHas('staff_members', [
            'full_name' => 'John Doe',
        ]);
    }

    public function test_can_show_staff_member(): void
    {
        $org = $this->createOrganizationStructure();
        
        // Create a user first
        $staffUser = User::factory()->create(['name' => 'Jane Smith', 'email' => 'jane@test.com']);
        
        $staff = StaffMember::create([
            'full_name' => 'Jane Smith',
            'hire_date' => '2024-01-01',
            'base_salary' => 60000,
            'office_location_id' => $org['location']->id,
            'division_id' => $org['division']->id,
            'job_title_id' => $org['jobTitle']->id,
            'user_id' => $staffUser->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/staff-members/' . $staff->id);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'full_name' => 'Jane Smith',
                ],
            ]);
    }

    public function test_can_update_staff_member(): void
    {
        $org = $this->createOrganizationStructure();
        $staffUser = User::factory()->create(['name' => 'Jane Smith', 'email' => 'jane2@test.com']);
        
        $staff = StaffMember::create([
            'full_name' => 'Jane Smith',
            'hire_date' => '2024-01-01',
            'base_salary' => 60000,
            'office_location_id' => $org['location']->id,
            'user_id' => $staffUser->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->putJson('/api/staff-members/' . $staff->id, [
                'full_name' => 'Janet Smith',
                'base_salary' => 65000,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('staff_members', [
            'id' => $staff->id,
            'full_name' => 'Janet Smith',
            'base_salary' => 65000,
        ]);
    }

    public function test_can_delete_staff_member(): void
    {
        $org = $this->createOrganizationStructure();
        $staffUser = User::factory()->create(['name' => 'To Delete', 'email' => 'delete@test.com']);
        
        $staff = StaffMember::create([
            'full_name' => 'To Delete',
            'hire_date' => '2024-01-01',
            'office_location_id' => $org['location']->id,
            'user_id' => $staffUser->id,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->deleteJson('/api/staff-members/' . $staff->id);

        $response->assertStatus(200);

        $this->assertDatabaseMissing('staff_members', ['id' => $staff->id, 'deleted_at' => null]);
    }

    public function test_validates_required_fields(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/staff-members', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['full_name', 'email']);
    }
}
