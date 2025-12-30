<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables to add org_id and company_id columns to.
     * Excludes: documents, organizations, companies, document_locations
     * Also excludes Laravel system tables and Spatie permission tables.
     */
    private array $tables = [
        'advance_types',
        'allowed_ip_addresses',
        'application_notes',
        'appraisal_cycles',
        'appraisal_records',
        'asset_assignments',
        'asset_types',
        'assets',
        'attendance_regularizations',
        'benefit_types',
        'bonus_payments',
        'business_trips',
        'candidate_assessments',
        'candidates',
        'company_event_attendees',
        'company_events',
        'company_holidays',
        'company_notice_recipients',
        'company_notices',
        'compensation_categories',
        'contract_renewals',
        'contract_types',
        'contracts',
        'custom_questions',
        'data_imports',
        'discipline_notes',
        'divisions',
        'document_acknowledgments',
        'document_aws_configs',
        'document_categories',
        'document_local_configs',
        'document_types',
        'document_wasabi_configs',
        'employee_onboardings',
        'employer_contributions',
        'exit_categories',
        'extra_hours_records',
        'file_categories',
        'generated_letters',
        'grievances',
        'hr_documents',
        'incentive_records',
        'interview_schedules',
        'job_applications',
        'job_categories',
        'job_postings',
        'job_requisitions',
        'job_stages',
        'job_titles',
        'letter_templates',
        'location_transfers',
        'media_directories',
        'media_files',
        'meeting_action_items',
        'meeting_attendees',
        'meeting_minutes',
        'meeting_rooms',
        'meeting_types',
        'meetings',
        'minimum_tax_limits',
        'offboardings',
        'offer_templates',
        'offers',
        'office_locations',
        'onboarding_task_completions',
        'onboarding_tasks',
        'onboarding_templates',
        'organization_documents',
        'organization_policies',
        'policy_acknowledgments',
        'recognition_categories',
        'recognition_records',
        'recurring_deductions',
        'role_upgrades',
        'salary_advances',
        'salary_slips',
        'shift_assignments',
        'shifts',
        'staff_benefits',
        'staff_files',
        'staff_members',
        'system_configurations',
        'tax_exemptions',
        'tax_slabs',
        'time_off_categories',
        'time_off_requests',
        'timesheet_projects',
        'timesheets',
        'training_participants',
        'training_programs',
        'training_sessions',
        'training_types',
        'users',
        'voluntary_exits',
        'withholding_types',
        'work_logs',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (! Schema::hasColumn($tableName, 'org_id')) {
                    $table->foreignId('org_id')
                        ->nullable()
                        ->constrained('organizations')
                        ->nullOnDelete();
                }

                if (! Schema::hasColumn($tableName, 'company_id')) {
                    $table->foreignId('company_id')
                        ->nullable()
                        ->constrained('companies')
                        ->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'company_id')) {
                    $table->dropForeign(['company_id']);
                    $table->dropColumn('company_id');
                }

                if (Schema::hasColumn($tableName, 'org_id')) {
                    $table->dropForeign(['org_id']);
                    $table->dropColumn('org_id');
                }
            });
        }
    }
};
