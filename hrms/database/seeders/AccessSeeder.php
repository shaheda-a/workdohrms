<?php

namespace Database\Seeders;

use App\Models\Resource;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AccessSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create resources (feature groups) - sorted by logical order
        $resources = [
            ['name' => 'Organizations', 'slug' => 'organizations', 'icon' => 'Building', 'description' => 'Manage organizations', 'sort_order' => 1],
            ['name' => 'Companies', 'slug' => 'companies', 'icon' => 'Briefcase', 'description' => 'Manage companies', 'sort_order' => 2],
            ['name' => 'Staff Management', 'slug' => 'staff', 'icon' => 'Users', 'description' => 'Manage employee records and profiles', 'sort_order' => 3],
            ['name' => 'Attendance', 'slug' => 'attendance', 'icon' => 'Clock', 'description' => 'Track work hours and attendance', 'sort_order' => 4],
            ['name' => 'Leave Management', 'slug' => 'time_off', 'icon' => 'Calendar', 'description' => 'Manage leave requests and balances', 'sort_order' => 5],
            ['name' => 'Payroll', 'slug' => 'payroll', 'icon' => 'DollarSign', 'description' => 'Process payroll and compensation', 'sort_order' => 6],
            ['name' => 'Recruitment', 'slug' => 'recruitment', 'icon' => 'UserPlus', 'description' => 'Manage job postings and candidates', 'sort_order' => 7],
            ['name' => 'Reports', 'slug' => 'reports', 'icon' => 'BarChart', 'description' => 'View and export reports', 'sort_order' => 8],
            ['name' => 'Settings', 'slug' => 'settings', 'icon' => 'Settings', 'description' => 'Configure system settings', 'sort_order' => 9],
            ['name' => 'Role Management', 'slug' => 'roles', 'icon' => 'Shield', 'description' => 'Manage roles and permissions', 'sort_order' => 10],
        ];

        foreach ($resources as $resource) {
            Resource::updateOrCreate(['slug' => $resource['slug']], $resource);
        }

        // Define permissions with resource and action - sorted by resource and action type
        $permissionDefinitions = [
            // ============================================
            // ORGANIZATIONS (Admin only)
            // ============================================
            ['name' => 'view_organizations', 'resource' => 'organizations', 'action' => 'view', 'description' => 'View organizations', 'sort_order' => 1],
            ['name' => 'create_organizations', 'resource' => 'organizations', 'action' => 'create', 'description' => 'Create organizations', 'sort_order' => 2],
            ['name' => 'edit_organizations', 'resource' => 'organizations', 'action' => 'edit', 'description' => 'Edit organizations', 'sort_order' => 3],
            ['name' => 'delete_organizations', 'resource' => 'organizations', 'action' => 'delete', 'description' => 'Delete organizations', 'sort_order' => 4],

            // ============================================
            // COMPANIES (Admin, Org)
            // ============================================
            ['name' => 'view_companies', 'resource' => 'companies', 'action' => 'view', 'description' => 'View companies', 'sort_order' => 1],
            ['name' => 'create_companies', 'resource' => 'companies', 'action' => 'create', 'description' => 'Create companies', 'sort_order' => 2],
            ['name' => 'edit_companies', 'resource' => 'companies', 'action' => 'edit', 'description' => 'Edit companies', 'sort_order' => 3],
            ['name' => 'delete_companies', 'resource' => 'companies', 'action' => 'delete', 'description' => 'Delete companies', 'sort_order' => 4],

            // ============================================
            // STAFF MANAGEMENT (Admin, Org, Company, HR)
            // ============================================
            // Core staff operations
            ['name' => 'view_staff', 'resource' => 'staff', 'action' => 'view', 'description' => 'View staff members', 'sort_order' => 1],
            ['name' => 'create_staff', 'resource' => 'staff', 'action' => 'create', 'description' => 'Create staff members', 'sort_order' => 2],
            ['name' => 'edit_staff', 'resource' => 'staff', 'action' => 'edit', 'description' => 'Edit staff members', 'sort_order' => 3],
            ['name' => 'delete_staff', 'resource' => 'staff', 'action' => 'delete', 'description' => 'Delete staff members', 'sort_order' => 4],
            ['name' => 'export_staff', 'resource' => 'staff', 'action' => 'export', 'description' => 'Export staff data', 'sort_order' => 5],
            // Recognition
            ['name' => 'view_recognition', 'resource' => 'staff', 'action' => 'view_recognition', 'description' => 'View recognition records', 'sort_order' => 6],
            ['name' => 'create_recognition', 'resource' => 'staff', 'action' => 'create_recognition', 'description' => 'Create recognition records', 'sort_order' => 7],
            ['name' => 'edit_recognition', 'resource' => 'staff', 'action' => 'edit_recognition', 'description' => 'Edit recognition records', 'sort_order' => 8],
            ['name' => 'delete_recognition', 'resource' => 'staff', 'action' => 'delete_recognition', 'description' => 'Delete recognition records', 'sort_order' => 9],
            // Role upgrades
            ['name' => 'view_role_upgrades', 'resource' => 'staff', 'action' => 'view_role_upgrades', 'description' => 'View role upgrades', 'sort_order' => 10],
            ['name' => 'create_role_upgrades', 'resource' => 'staff', 'action' => 'create_role_upgrades', 'description' => 'Create role upgrades', 'sort_order' => 11],
            ['name' => 'edit_role_upgrades', 'resource' => 'staff', 'action' => 'edit_role_upgrades', 'description' => 'Edit role upgrades', 'sort_order' => 12],
            ['name' => 'delete_role_upgrades', 'resource' => 'staff', 'action' => 'delete_role_upgrades', 'description' => 'Delete role upgrades', 'sort_order' => 13],
            // Transfers
            ['name' => 'view_transfers', 'resource' => 'staff', 'action' => 'view_transfers', 'description' => 'View location transfers', 'sort_order' => 14],
            ['name' => 'create_transfers', 'resource' => 'staff', 'action' => 'create_transfers', 'description' => 'Create location transfers', 'sort_order' => 15],
            ['name' => 'edit_transfers', 'resource' => 'staff', 'action' => 'edit_transfers', 'description' => 'Edit location transfers', 'sort_order' => 16],
            ['name' => 'delete_transfers', 'resource' => 'staff', 'action' => 'delete_transfers', 'description' => 'Delete location transfers', 'sort_order' => 17],
            // Discipline
            ['name' => 'view_discipline', 'resource' => 'staff', 'action' => 'view_discipline', 'description' => 'View discipline notes', 'sort_order' => 18],
            ['name' => 'create_discipline', 'resource' => 'staff', 'action' => 'create_discipline', 'description' => 'Create discipline notes', 'sort_order' => 19],
            ['name' => 'edit_discipline', 'resource' => 'staff', 'action' => 'edit_discipline', 'description' => 'Edit discipline notes', 'sort_order' => 20],
            ['name' => 'delete_discipline', 'resource' => 'staff', 'action' => 'delete_discipline', 'description' => 'Delete discipline notes', 'sort_order' => 21],
            // Offboarding
            ['name' => 'view_offboarding', 'resource' => 'staff', 'action' => 'view_offboarding', 'description' => 'View offboarding records', 'sort_order' => 22],
            ['name' => 'create_offboarding', 'resource' => 'staff', 'action' => 'create_offboarding', 'description' => 'Create offboarding records', 'sort_order' => 23],
            ['name' => 'edit_offboarding', 'resource' => 'staff', 'action' => 'edit_offboarding', 'description' => 'Edit offboarding records', 'sort_order' => 24],
            ['name' => 'delete_offboarding', 'resource' => 'staff', 'action' => 'delete_offboarding', 'description' => 'Delete offboarding records', 'sort_order' => 25],

            // ============================================
            // ATTENDANCE (Admin, Org, Company, HR; User for self-view)
            // ============================================
            ['name' => 'view_attendance', 'resource' => 'attendance', 'action' => 'view', 'description' => 'View attendance records', 'sort_order' => 1],
            ['name' => 'create_attendance', 'resource' => 'attendance', 'action' => 'create', 'description' => 'Create attendance records', 'sort_order' => 2],
            ['name' => 'edit_attendance', 'resource' => 'attendance', 'action' => 'edit', 'description' => 'Edit attendance records', 'sort_order' => 3],
            ['name' => 'delete_attendance', 'resource' => 'attendance', 'action' => 'delete', 'description' => 'Delete attendance records', 'sort_order' => 4],
            ['name' => 'bulk_attendance', 'resource' => 'attendance', 'action' => 'bulk', 'description' => 'Bulk attendance operations', 'sort_order' => 5],

            // ============================================
            // LEAVE MANAGEMENT (Admin, Org, Company, HR; User for self-service)
            // ============================================
            ['name' => 'view_time_off', 'resource' => 'time_off', 'action' => 'view', 'description' => 'View leave requests', 'sort_order' => 1],
            ['name' => 'create_time_off', 'resource' => 'time_off', 'action' => 'create', 'description' => 'Create leave requests', 'sort_order' => 2],
            ['name' => 'edit_time_off', 'resource' => 'time_off', 'action' => 'edit', 'description' => 'Edit leave requests', 'sort_order' => 3],
            ['name' => 'delete_time_off', 'resource' => 'time_off', 'action' => 'delete', 'description' => 'Delete leave requests', 'sort_order' => 4],
            ['name' => 'approve_time_off', 'resource' => 'time_off', 'action' => 'approve', 'description' => 'Approve/reject leave requests', 'sort_order' => 5],

            // ============================================
            // PAYROLL (Admin, Org, Company, HR; User for viewing own)
            // ============================================
            ['name' => 'view_payslips', 'resource' => 'payroll', 'action' => 'view', 'description' => 'View payslips', 'sort_order' => 1],
            ['name' => 'generate_payslips', 'resource' => 'payroll', 'action' => 'generate', 'description' => 'Generate payslips', 'sort_order' => 2],
            ['name' => 'send_payslips', 'resource' => 'payroll', 'action' => 'send', 'description' => 'Send payslips to employees', 'sort_order' => 3],
            ['name' => 'view_compensation', 'resource' => 'payroll', 'action' => 'view_compensation', 'description' => 'View compensation details', 'sort_order' => 4],
            ['name' => 'create_compensation', 'resource' => 'payroll', 'action' => 'create_compensation', 'description' => 'Create compensation records', 'sort_order' => 5],
            ['name' => 'edit_compensation', 'resource' => 'payroll', 'action' => 'edit_compensation', 'description' => 'Edit compensation records', 'sort_order' => 6],
            ['name' => 'delete_compensation', 'resource' => 'payroll', 'action' => 'delete_compensation', 'description' => 'Delete compensation records', 'sort_order' => 7],

            // ============================================
            // RECRUITMENT (Admin, Org, Company, HR)
            // ============================================
            ['name' => 'view_recruitment', 'resource' => 'recruitment', 'action' => 'view', 'description' => 'View job postings and candidates', 'sort_order' => 1],
            ['name' => 'create_recruitment', 'resource' => 'recruitment', 'action' => 'create', 'description' => 'Create job postings', 'sort_order' => 2],
            ['name' => 'edit_recruitment', 'resource' => 'recruitment', 'action' => 'edit', 'description' => 'Edit job postings', 'sort_order' => 3],
            ['name' => 'delete_recruitment', 'resource' => 'recruitment', 'action' => 'delete', 'description' => 'Delete job postings', 'sort_order' => 4],
            ['name' => 'manage_candidates', 'resource' => 'recruitment', 'action' => 'manage_candidates', 'description' => 'Manage candidates and applications', 'sort_order' => 5],

            // ============================================
            // REPORTS (Admin, Org, Company, HR)
            // ============================================
            ['name' => 'view_reports', 'resource' => 'reports', 'action' => 'view', 'description' => 'View reports', 'sort_order' => 1],
            ['name' => 'export_reports', 'resource' => 'reports', 'action' => 'export', 'description' => 'Export reports', 'sort_order' => 2],
            ['name' => 'view_hr_dashboard', 'resource' => 'reports', 'action' => 'view_hr_dashboard', 'description' => 'View HR dashboard', 'sort_order' => 3],
            ['name' => 'view_admin_dashboard', 'resource' => 'reports', 'action' => 'view_admin_dashboard', 'description' => 'View admin dashboard', 'sort_order' => 4],

            // ============================================
            // SETTINGS (Admin, Org, Company, HR with varying levels)
            // ============================================
            ['name' => 'view_settings', 'resource' => 'settings', 'action' => 'view', 'description' => 'View settings', 'sort_order' => 1],
            ['name' => 'edit_settings', 'resource' => 'settings', 'action' => 'edit', 'description' => 'Edit settings', 'sort_order' => 2],
            // Locations
            ['name' => 'view_locations', 'resource' => 'settings', 'action' => 'view_locations', 'description' => 'View office locations', 'sort_order' => 3],
            ['name' => 'create_locations', 'resource' => 'settings', 'action' => 'create_locations', 'description' => 'Create office locations', 'sort_order' => 4],
            ['name' => 'edit_locations', 'resource' => 'settings', 'action' => 'edit_locations', 'description' => 'Edit office locations', 'sort_order' => 5],
            ['name' => 'delete_locations', 'resource' => 'settings', 'action' => 'delete_locations', 'description' => 'Delete office locations', 'sort_order' => 6],
            // Divisions
            ['name' => 'view_divisions', 'resource' => 'settings', 'action' => 'view_divisions', 'description' => 'View divisions', 'sort_order' => 7],
            ['name' => 'create_divisions', 'resource' => 'settings', 'action' => 'create_divisions', 'description' => 'Create divisions', 'sort_order' => 8],
            ['name' => 'edit_divisions', 'resource' => 'settings', 'action' => 'edit_divisions', 'description' => 'Edit divisions', 'sort_order' => 9],
            ['name' => 'delete_divisions', 'resource' => 'settings', 'action' => 'delete_divisions', 'description' => 'Delete divisions', 'sort_order' => 10],
            // Job Titles
            ['name' => 'view_job_titles', 'resource' => 'settings', 'action' => 'view_job_titles', 'description' => 'View job titles', 'sort_order' => 11],
            ['name' => 'create_job_titles', 'resource' => 'settings', 'action' => 'create_job_titles', 'description' => 'Create job titles', 'sort_order' => 12],
            ['name' => 'edit_job_titles', 'resource' => 'settings', 'action' => 'edit_job_titles', 'description' => 'Edit job titles', 'sort_order' => 13],
            ['name' => 'delete_job_titles', 'resource' => 'settings', 'action' => 'delete_job_titles', 'description' => 'Delete job titles', 'sort_order' => 14],
            // Announcements
            ['name' => 'view_announcements', 'resource' => 'settings', 'action' => 'view_announcements', 'description' => 'View announcements', 'sort_order' => 15],
            ['name' => 'create_announcements', 'resource' => 'settings', 'action' => 'create_announcements', 'description' => 'Create announcements', 'sort_order' => 16],
            ['name' => 'edit_announcements', 'resource' => 'settings', 'action' => 'edit_announcements', 'description' => 'Edit announcements', 'sort_order' => 17],
            ['name' => 'delete_announcements', 'resource' => 'settings', 'action' => 'delete_announcements', 'description' => 'Delete announcements', 'sort_order' => 18],

            // ============================================
            // ROLE MANAGEMENT (Admin, Org)
            // ============================================
            ['name' => 'view_roles', 'resource' => 'roles', 'action' => 'view', 'description' => 'View roles', 'sort_order' => 1],
            ['name' => 'create_roles', 'resource' => 'roles', 'action' => 'create', 'description' => 'Create roles', 'sort_order' => 2],
            ['name' => 'edit_roles', 'resource' => 'roles', 'action' => 'edit', 'description' => 'Edit roles', 'sort_order' => 3],
            ['name' => 'delete_roles', 'resource' => 'roles', 'action' => 'delete', 'description' => 'Delete roles', 'sort_order' => 4],
            ['name' => 'assign_roles', 'resource' => 'roles', 'action' => 'assign', 'description' => 'Assign roles to users', 'sort_order' => 5],
            ['name' => 'view_users', 'resource' => 'roles', 'action' => 'view_users', 'description' => 'View users', 'sort_order' => 6],
            ['name' => 'edit_users', 'resource' => 'roles', 'action' => 'edit_users', 'description' => 'Edit users', 'sort_order' => 7],
        ];

        // Create all permissions with resource and action
        foreach ($permissionDefinitions as $permDef) {
            $permission = Permission::firstOrCreate(
                ['name' => $permDef['name']],
                ['guard_name' => 'web']
            );
            $permission->update([
                'resource' => $permDef['resource'],
                'action' => $permDef['action'],
                'description' => $permDef['description'],
                'sort_order' => $permDef['sort_order'],
            ]);
        }

        // ============================================
        // CREATE 5 DEFAULT SYSTEM ROLES
        // ============================================
        $roleDefinitions = [
            [
                'name' => 'admin',
                'is_system' => true,
                'hierarchy_level' => 1,
                'description' => 'Full system access - can manage all data across all organizations and companies',
                'icon' => 'ShieldCheck',
            ],
            [
                'name' => 'org',
                'is_system' => true,
                'hierarchy_level' => 2,
                'description' => 'Organization-wide access - manages all companies under their organization',
                'icon' => 'Building',
            ],
            [
                'name' => 'company',
                'is_system' => true,
                'hierarchy_level' => 3,
                'description' => 'Company-level access - manages a single company',
                'icon' => 'Briefcase',
            ],
            [
                'name' => 'hr',
                'is_system' => true,
                'hierarchy_level' => 4,
                'description' => 'HR operations - manages staff, attendance, leave, and payroll',
                'icon' => 'Users',
            ],
            [
                'name' => 'user',
                'is_system' => true,
                'hierarchy_level' => 5,
                'description' => 'Self-service only - can view own records and apply for leave',
                'icon' => 'User',
            ],
        ];

        foreach ($roleDefinitions as $roleDef) {
            $role = Role::firstOrCreate(
                ['name' => $roleDef['name']],
                ['guard_name' => 'web']
            );
            $role->update([
                'is_system' => $roleDef['is_system'],
                'hierarchy_level' => $roleDef['hierarchy_level'],
                'description' => $roleDef['description'],
                'icon' => $roleDef['icon'],
            ]);
        }

        // ============================================
        // ASSIGN PERMISSIONS TO ROLES
        // ============================================

        // ADMIN: Full access (all permissions)
        $adminRole = Role::findByName('admin');
        $adminRole->givePermissionTo(Permission::all());

        // ORG: Organization-wide access
        $orgRole = Role::findByName('org');
        $orgRole->syncPermissions([
            // Companies (CRUD for companies under their org)
            'view_companies', 'create_companies', 'edit_companies', 'delete_companies',
            // Staff (full CRUD)
            'view_staff', 'create_staff', 'edit_staff', 'delete_staff', 'export_staff',
            'view_recognition', 'create_recognition', 'edit_recognition', 'delete_recognition',
            'view_role_upgrades', 'create_role_upgrades', 'edit_role_upgrades', 'delete_role_upgrades',
            'view_transfers', 'create_transfers', 'edit_transfers', 'delete_transfers',
            'view_discipline', 'create_discipline', 'edit_discipline', 'delete_discipline',
            'view_offboarding', 'create_offboarding', 'edit_offboarding', 'delete_offboarding',
            // Attendance (full CRUD + bulk)
            'view_attendance', 'create_attendance', 'edit_attendance', 'delete_attendance', 'bulk_attendance',
            // Leave (full CRUD + approve)
            'view_time_off', 'create_time_off', 'edit_time_off', 'delete_time_off', 'approve_time_off',
            // Payroll (full access)
            'view_payslips', 'generate_payslips', 'send_payslips',
            'view_compensation', 'create_compensation', 'edit_compensation', 'delete_compensation',
            // Recruitment (full CRUD)
            'view_recruitment', 'create_recruitment', 'edit_recruitment', 'delete_recruitment', 'manage_candidates',
            // Reports (full access)
            'view_reports', 'export_reports', 'view_hr_dashboard', 'view_admin_dashboard',
            // Settings (full CRUD)
            'view_settings', 'edit_settings',
            'view_locations', 'create_locations', 'edit_locations', 'delete_locations',
            'view_divisions', 'create_divisions', 'edit_divisions', 'delete_divisions',
            'view_job_titles', 'create_job_titles', 'edit_job_titles', 'delete_job_titles',
            'view_announcements', 'create_announcements', 'edit_announcements', 'delete_announcements',
            // Role management (view + assign)
            'view_roles', 'assign_roles', 'view_users', 'edit_users',
        ]);

        // COMPANY: Company-level access
        $companyRole = Role::findByName('company');
        $companyRole->syncPermissions([
            // Companies (view only - their own)
            'view_companies',
            // Staff (CRUD within company, no delete)
            'view_staff', 'create_staff', 'edit_staff', 'export_staff',
            'view_recognition', 'create_recognition', 'edit_recognition',
            'view_role_upgrades', 'create_role_upgrades',
            'view_transfers', 'create_transfers',
            'view_discipline', 'create_discipline',
            'view_offboarding', 'create_offboarding',
            // Attendance (CRUD + bulk)
            'view_attendance', 'create_attendance', 'edit_attendance', 'bulk_attendance',
            // Leave (CRUD + approve)
            'view_time_off', 'create_time_off', 'edit_time_off', 'approve_time_off',
            // Payroll (full access)
            'view_payslips', 'generate_payslips', 'send_payslips',
            'view_compensation', 'create_compensation', 'edit_compensation',
            // Recruitment (CRUD)
            'view_recruitment', 'create_recruitment', 'edit_recruitment', 'manage_candidates',
            // Reports (view + export + HR dashboard)
            'view_reports', 'export_reports', 'view_hr_dashboard',
            // Settings (view only for structure)
            'view_settings',
            'view_locations', 'view_divisions', 'view_job_titles',
            'view_announcements', 'create_announcements',
            // Role management (view + assign for lower roles)
            'view_roles', 'assign_roles', 'view_users',
        ]);

        // HR: HR operations
        $hrRole = Role::findByName('hr');
        $hrRole->syncPermissions([
            // Staff (view, create, edit - no delete)
            'view_staff', 'create_staff', 'edit_staff',
            'view_recognition', 'create_recognition', 'edit_recognition',
            'view_role_upgrades', 'create_role_upgrades',
            'view_transfers', 'create_transfers',
            'view_discipline', 'create_discipline',
            'view_offboarding', 'create_offboarding',
            // Attendance (view, create, edit, bulk - no delete)
            'view_attendance', 'create_attendance', 'edit_attendance', 'bulk_attendance',
            // Leave (view, create, edit, approve - no delete)
            'view_time_off', 'create_time_off', 'edit_time_off', 'approve_time_off',
            // Payroll (view, generate, send, compensation management)
            'view_payslips', 'generate_payslips', 'send_payslips',
            'view_compensation', 'create_compensation', 'edit_compensation',
            // Recruitment (view, create, edit, manage candidates)
            'view_recruitment', 'create_recruitment', 'edit_recruitment', 'manage_candidates',
            // Reports (view + HR dashboard)
            'view_reports', 'view_hr_dashboard',
            // Settings (view + create/edit for structure)
            'view_settings',
            'view_locations', 'create_locations', 'edit_locations',
            'view_divisions', 'create_divisions', 'edit_divisions',
            'view_job_titles', 'create_job_titles', 'edit_job_titles',
            'view_announcements', 'create_announcements', 'edit_announcements',
        ]);

        // USER: Self-service only
        $userRole = Role::findByName('user');
        $userRole->syncPermissions([
            // Leave (view own, create own)
            'view_time_off', 'create_time_off',
            // Attendance (view own)
            'view_attendance',
            // Payroll (view own payslips)
            'view_payslips',
            // Announcements (view)
            'view_announcements',
        ]);

        // ============================================
        // LEGACY ROLE ALIASES FOR BACKWARD COMPATIBILITY
        // ============================================
        $legacyRoleAliases = [
            'administrator' => ['canonical' => 'admin', 'hierarchy_level' => 1, 'description' => 'Legacy alias of admin role'],
            'organisation' => ['canonical' => 'org', 'hierarchy_level' => 2, 'description' => 'Legacy alias of org role'],
            'hr_officer' => ['canonical' => 'hr', 'hierarchy_level' => 4, 'description' => 'Legacy alias of hr role'],
            'manager' => ['canonical' => 'company', 'hierarchy_level' => 3, 'description' => 'Legacy alias of company role'],
            'staff' => ['canonical' => 'user', 'hierarchy_level' => 5, 'description' => 'Legacy alias of user role'],
            'staff_member' => ['canonical' => 'user', 'hierarchy_level' => 5, 'description' => 'Legacy alias of user role'],
        ];

        foreach ($legacyRoleAliases as $legacyName => $config) {
            $canonicalRole = Role::findByName($config['canonical']);
            if ($canonicalRole) {
                $legacyRole = Role::firstOrCreate(
                    ['name' => $legacyName, 'guard_name' => 'web'],
                    [
                        'is_system' => true,
                        'hierarchy_level' => $config['hierarchy_level'],
                        'description' => $config['description'],
                        'icon' => $canonicalRole->icon,
                    ]
                );
                $legacyRole->syncPermissions($canonicalRole->permissions);
            }
        }

        $this->command->info('Roles, resources, and permissions seeded successfully!');
        $this->command->info('5 Default Roles: admin, org, company, hr, user');
    }
}
