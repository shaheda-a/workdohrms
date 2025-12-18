<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Attendance Regularizations
        if (!Schema::hasTable('attendance_regularizations')) {
            Schema::create('attendance_regularizations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('staff_member_id')->constrained()->onDelete('cascade');
                $table->foreignId('work_log_id')->nullable()->constrained()->nullOnDelete();
                $table->date('date');
                $table->timestamp('original_clock_in')->nullable();
                $table->timestamp('original_clock_out')->nullable();
                $table->timestamp('requested_clock_in');
                $table->timestamp('requested_clock_out')->nullable();
                $table->text('reason');
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->text('review_notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_regularizations');
    }
};
