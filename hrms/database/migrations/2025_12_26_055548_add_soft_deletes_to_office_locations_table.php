<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('office_locations') && ! Schema::hasColumn('office_locations', 'deleted_at')) {
            Schema::table('office_locations', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('office_locations') && Schema::hasColumn('office_locations', 'deleted_at')) {
            Schema::table('office_locations', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
