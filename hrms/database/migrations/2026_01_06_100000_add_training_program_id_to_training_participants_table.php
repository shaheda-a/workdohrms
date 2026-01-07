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
        Schema::table('training_participants', function (Blueprint $table) {
            // ADDED: training_program_id support
            $table->foreignId('training_program_id')
                ->nullable()
                ->after('staff_member_id')
                ->constrained('training_programs')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('training_participants', function (Blueprint $table) {
            $table->dropForeign(['training_program_id']);
            $table->dropColumn('training_program_id');
        });
    }
};
