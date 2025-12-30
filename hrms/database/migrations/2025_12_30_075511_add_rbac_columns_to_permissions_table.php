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
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('resource')->nullable()->after('guard_name');
            $table->string('action')->nullable()->after('resource');
            $table->text('description')->nullable()->after('action');
            $table->integer('sort_order')->default(0)->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn(['resource', 'action', 'description', 'sort_order']);
        });
    }
};
