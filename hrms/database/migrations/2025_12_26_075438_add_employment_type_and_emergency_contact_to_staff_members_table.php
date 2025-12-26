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
        Schema::table('staff_members', function (Blueprint $table) {
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern'])->default('full_time')->after('employment_status');
            $table->string('emergency_contact_name')->nullable()->after('employment_type');
            $table->string('emergency_contact_phone', 20)->nullable()->after('emergency_contact_name');
            $table->string('emergency_contact_relationship', 100)->nullable()->after('emergency_contact_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff_members', function (Blueprint $table) {
            $table->dropColumn(['employment_type', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship']);
        });
    }
};
