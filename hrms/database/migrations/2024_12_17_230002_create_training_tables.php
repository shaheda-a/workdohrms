<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Training Types
        Schema::create('training_types', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('default_duration')->nullable();
            $table->timestamps();
        });

        // Training Programs
        Schema::create('training_programs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('training_type_id')->constrained()->onDelete('cascade');
            $table->text('description')->nullable();
            $table->string('duration')->nullable();
            $table->decimal('cost', 15, 2)->default(0);
            $table->string('trainer_name')->nullable();
            $table->enum('trainer_type', ['internal', 'external'])->default('internal');
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->timestamps();
        });

        // Training Sessions
        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_program_id')->constrained()->onDelete('cascade');
            $table->string('session_name');
            $table->date('date');
            $table->time('time')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('trainer_id')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->integer('max_participants')->default(20);
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->timestamps();
        });

        // Training Participants
        Schema::create('training_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('staff_member_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['enrolled', 'withdrawn', 'completed'])->default('enrolled');
            $table->enum('attendance_status', ['pending', 'present', 'absent'])->default('pending');
            $table->decimal('score', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->boolean('certificate_issued')->default(false);
            $table->timestamp('certificate_issued_at')->nullable();
            $table->timestamps();

            $table->unique(['training_session_id', 'staff_member_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_participants');
        Schema::dropIfExists('training_sessions');
        Schema::dropIfExists('training_programs');
        Schema::dropIfExists('training_types');
    }
};
