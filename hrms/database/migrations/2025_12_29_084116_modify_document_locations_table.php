<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            Schema::dropIfExists('document_locations');
            Schema::create('document_locations', function (Blueprint $table) {
                $table->id();
                $table->tinyInteger('location_type');
                $table->foreignId('org_id')->nullable()->constrained('organizations')->onDelete('cascade');
                $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
                $table->timestamps();
            });
        } else {
            Schema::table('document_locations', function (Blueprint $table) {
                $table->dropColumn(['name', 'slug', 'is_active']);
                $table->tinyInteger('location_type')->after('id');
                $table->foreignId('org_id')->nullable()->after('location_type')->constrained('organizations')->onDelete('cascade');
                $table->foreignId('company_id')->nullable()->after('org_id')->constrained('companies')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_locations', function (Blueprint $table) {
            // Drop new columns
            $table->dropForeign(['org_id']);
            $table->dropForeign(['company_id']);
            $table->dropColumn(['location_type', 'org_id', 'company_id']);

            // Restore old columns
            $table->string('name')->after('id');
            $table->string('slug')->unique()->after('name');
            $table->boolean('is_active')->default(true)->after('slug');
        });
    }
};
