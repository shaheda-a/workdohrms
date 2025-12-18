<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Asset Types
        Schema::create('asset_types', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('depreciation_rate', 5, 2)->default(0);
            $table->timestamps();
        });

        // Assets
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('asset_type_id')->constrained()->onDelete('cascade');
            $table->string('serial_number')->nullable();
            $table->string('asset_code')->unique()->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_cost', 15, 2)->nullable();
            $table->decimal('current_value', 15, 2)->nullable();
            $table->enum('status', ['available', 'assigned', 'maintenance', 'disposed'])->default('available');
            $table->enum('condition', ['new', 'good', 'fair', 'poor'])->default('good');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('supplier')->nullable();
            $table->text('warranty_info')->nullable();
            $table->date('warranty_expiry')->nullable();
            $table->string('qr_code')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('staff_members')->nullOnDelete();
            $table->date('assigned_date')->nullable();
            $table->timestamps();
        });

        // Asset Assignments History
        Schema::create('asset_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained()->onDelete('cascade');
            $table->foreignId('staff_member_id')->constrained()->onDelete('cascade');
            $table->date('assigned_date');
            $table->date('returned_date')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_assignments');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('asset_types');
    }
};
