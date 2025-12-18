<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Job Requisitions
        if (!Schema::hasTable('job_requisitions')) {
            Schema::create('job_requisitions', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->foreignId('division_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('job_title_id')->nullable()->constrained()->nullOnDelete();
                $table->integer('number_of_positions')->default(1);
                $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
                $table->foreignId('requested_by')->nullable()->constrained('staff_members')->nullOnDelete();
                $table->text('justification');
                $table->json('required_skills')->nullable();
                $table->string('experience_required')->nullable();
                $table->decimal('budget_from', 15, 2)->nullable();
                $table->decimal('budget_to', 15, 2)->nullable();
                $table->date('target_date')->nullable();
                $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'fulfilled'])->default('draft');
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamps();
            });
        }

        // Add requisition_id to job_postings if not exists
        if (Schema::hasTable('job_postings') && !Schema::hasColumn('job_postings', 'requisition_id')) {
            Schema::table('job_postings', function (Blueprint $table) {
                $table->foreignId('requisition_id')->nullable()->after('id')->constrained('job_requisitions')->nullOnDelete();
            });
        }

        // Offer Templates
        if (!Schema::hasTable('offer_templates')) {
            Schema::create('offer_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->longText('content');
                $table->json('variables')->nullable();
                $table->boolean('is_default')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Offers
        if (!Schema::hasTable('offers')) {
            Schema::create('offers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('candidate_id')->constrained()->onDelete('cascade');
                $table->foreignId('job_posting_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('template_id')->nullable()->constrained('offer_templates')->nullOnDelete();
                $table->string('job_title');
                $table->decimal('salary', 15, 2);
                $table->date('start_date');
                $table->date('expiry_date');
                $table->json('benefits')->nullable();
                $table->longText('terms_conditions')->nullable();
                $table->longText('content')->nullable();
                $table->string('document_path')->nullable();
                $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired', 'withdrawn'])->default('draft');
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('responded_at')->nullable();
                $table->text('response_notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        // Candidate Assessments
        if (!Schema::hasTable('candidate_assessments')) {
            Schema::create('candidate_assessments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('candidate_id')->constrained()->onDelete('cascade');
                $table->foreignId('job_application_id')->nullable()->constrained()->onDelete('cascade');
                $table->enum('assessment_type', ['technical', 'aptitude', 'personality', 'coding', 'language', 'other'])->default('technical');
                $table->string('title');
                $table->decimal('score', 8, 2)->nullable();
                $table->decimal('max_score', 8, 2)->nullable();
                $table->decimal('percentage', 5, 2)->nullable();
                $table->date('assessment_date');
                $table->foreignId('assessed_by')->nullable()->constrained('staff_members')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->string('attachment_path')->nullable();
                $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_assessments');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('offer_templates');
        
        if (Schema::hasColumn('job_postings', 'requisition_id')) {
            Schema::table('job_postings', function (Blueprint $table) {
                $table->dropForeign(['requisition_id']);
                $table->dropColumn('requisition_id');
            });
        }
        
        Schema::dropIfExists('job_requisitions');
    }
};
