<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Document Categories
        if (!Schema::hasTable('document_categories')) {
            Schema::create('document_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->foreignId('parent_id')->nullable()->constrained('document_categories')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // HR Documents
        if (!Schema::hasTable('hr_documents')) {
            Schema::create('hr_documents', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->foreignId('category_id')->nullable()->constrained('document_categories')->nullOnDelete();
                $table->text('description')->nullable();
                $table->string('file_path');
                $table->string('file_type')->nullable();
                $table->bigInteger('file_size')->nullable();
                $table->string('version')->default('1.0');
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->boolean('requires_acknowledgment')->default(false);
                $table->date('expiry_date')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Document Acknowledgments
        if (!Schema::hasTable('document_acknowledgments')) {
            Schema::create('document_acknowledgments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('document_id')->constrained('hr_documents')->onDelete('cascade');
                $table->foreignId('staff_member_id')->constrained()->onDelete('cascade');
                $table->timestamp('acknowledged_at');
                $table->string('ip_address')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['document_id', 'staff_member_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('document_acknowledgments');
        Schema::dropIfExists('hr_documents');
        Schema::dropIfExists('document_categories');
    }
};
