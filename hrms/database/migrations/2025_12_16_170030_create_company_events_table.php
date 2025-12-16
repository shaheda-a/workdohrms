<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('company_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('event_start');
            $table->date('event_end')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->string('color', 20)->default('#3788d8');
            $table->text('description')->nullable();
            $table->boolean('is_all_day')->default(true);
            $table->boolean('is_company_wide')->default(true);
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->unsignedBigInteger('author_id')->nullable();
            $table->timestamps();

            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
        });

        // Pivot table for event attendees
        Schema::create('company_event_attendees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_event_id')->constrained('company_events')->cascadeOnDelete();
            $table->foreignId('staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->enum('response', ['pending', 'accepted', 'declined', 'maybe'])->default('pending');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->unique(['company_event_id', 'staff_member_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_event_attendees');
        Schema::dropIfExists('company_events');
    }
};
