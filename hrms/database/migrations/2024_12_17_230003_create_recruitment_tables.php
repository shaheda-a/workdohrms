<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Job Categories
        if (!Schema::hasTable('job_categories')) {
            Schema::create('job_categories', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // Job Stages (Kanban)
        if (!Schema::hasTable('job_stages')) {
            Schema::create('job_stages', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->integer('order')->default(0);
                $table->string('color')->default('#6366f1');
                $table->boolean('is_default')->default(false);
                $table->timestamps();
            });
        }

        // Job Postings
        if (!Schema::hasTable('job_postings')) {
            Schema::create('job_postings', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->foreignId('job_category_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('office_location_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('division_id')->nullable()->constrained()->nullOnDelete();
                $table->integer('positions')->default(1);
                $table->text('description')->nullable();
                $table->text('requirements')->nullable();
                $table->text('skills')->nullable();
                $table->string('experience_required')->nullable();
                $table->decimal('salary_from', 15, 2)->nullable();
                $table->decimal('salary_to', 15, 2)->nullable();
                $table->enum('status', ['draft', 'open', 'closed', 'on_hold'])->default('draft');
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->timestamps();
            });
        }

        // Custom Questions
        if (!Schema::hasTable('custom_questions')) {
            Schema::create('custom_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_posting_id')->constrained()->onDelete('cascade');
                $table->text('question');
                $table->boolean('is_required')->default(false);
                $table->integer('order')->default(0);
                $table->timestamps();
            });
        }

        // Candidates
        if (!Schema::hasTable('candidates')) {
            Schema::create('candidates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->date('date_of_birth')->nullable();
                $table->enum('gender', ['male', 'female', 'other'])->nullable();
                $table->text('address')->nullable();
                $table->string('resume_path')->nullable();
                $table->text('cover_letter')->nullable();
                $table->string('linkedin_url')->nullable();
                $table->enum('source', ['website', 'referral', 'job_portal', 'social_media', 'other'])->default('website');
                $table->enum('status', ['new', 'screening', 'interview', 'offered', 'hired', 'rejected'])->default('new');
                $table->boolean('is_archived')->default(false);
                $table->timestamps();
            });
        }

        // Job Applications
        if (!Schema::hasTable('job_applications')) {
            Schema::create('job_applications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_posting_id')->constrained()->onDelete('cascade');
                $table->foreignId('candidate_id')->constrained()->onDelete('cascade');
                $table->foreignId('job_stage_id')->nullable()->constrained()->nullOnDelete();
                $table->date('applied_date');
                $table->integer('rating')->nullable();
                $table->text('notes')->nullable();
                $table->json('custom_answers')->nullable();
                $table->enum('status', ['pending', 'shortlisted', 'rejected', 'hired'])->default('pending');
                $table->timestamps();

                $table->unique(['job_posting_id', 'candidate_id']);
            });
        }

        // Application Notes
        if (!Schema::hasTable('application_notes')) {
            Schema::create('application_notes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_application_id')->constrained()->onDelete('cascade');
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->text('note');
                $table->timestamps();
            });
        }

        // Interview Schedules
        if (!Schema::hasTable('interview_schedules')) {
            Schema::create('interview_schedules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_application_id')->constrained()->onDelete('cascade');
                $table->foreignId('interviewer_id')->nullable()->constrained('staff_members')->nullOnDelete();
                $table->integer('round_number')->default(1);
                $table->date('scheduled_date');
                $table->time('scheduled_time');
                $table->integer('duration_minutes')->default(60);
                $table->string('location')->nullable();
                $table->string('meeting_link')->nullable();
                $table->text('notes')->nullable();
                $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
                $table->text('feedback')->nullable();
                $table->integer('rating')->nullable();
                $table->enum('recommendation', ['proceed', 'hold', 'reject'])->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('interview_schedules');
        Schema::dropIfExists('application_notes');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('candidates');
        Schema::dropIfExists('custom_questions');
        Schema::dropIfExists('job_postings');
        Schema::dropIfExists('job_stages');
        Schema::dropIfExists('job_categories');
    }
};
