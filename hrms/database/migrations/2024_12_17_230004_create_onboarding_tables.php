<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Onboarding Templates
        Schema::create('onboarding_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('days_to_complete')->default(30);
            $table->timestamps();
        });

        // Onboarding Tasks
        Schema::create('onboarding_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('onboarding_template_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->integer('days_before_start')->default(0);
            $table->timestamps();
        });

        // Employee Onboarding
        Schema::create('employee_onboardings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_member_id')->constrained()->onDelete('cascade');
            $table->foreignId('onboarding_template_id')->constrained()->onDelete('cascade');
            $table->date('start_date');
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamps();
        });

        // Onboarding Task Completions
        Schema::create('onboarding_task_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_onboarding_id')->constrained()->onDelete('cascade');
            $table->foreignId('onboarding_task_id')->constrained()->onDelete('cascade');
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['employee_onboarding_id', 'onboarding_task_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarding_task_completions');
        Schema::dropIfExists('employee_onboardings');
        Schema::dropIfExists('onboarding_tasks');
        Schema::dropIfExists('onboarding_templates');
    }
};
