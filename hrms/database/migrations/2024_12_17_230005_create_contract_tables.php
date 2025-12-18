<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Contract Types
        Schema::create('contract_types', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('default_duration_months')->default(12);
            $table->timestamps();
        });

        // Contracts
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_member_id')->constrained()->onDelete('cascade');
            $table->foreignId('contract_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference_number')->unique();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('salary', 15, 2)->nullable();
            $table->text('terms')->nullable();
            $table->string('document_path')->nullable();
            $table->enum('status', ['draft', 'active', 'expired', 'terminated'])->default('draft');
            $table->integer('renewal_reminder_days')->default(30);
            $table->timestamps();
        });

        // Contract Renewals
        Schema::create('contract_renewals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->onDelete('cascade');
            $table->date('old_end_date');
            $table->date('new_end_date');
            $table->decimal('new_salary', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('renewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('renewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_renewals');
        Schema::dropIfExists('contracts');
        Schema::dropIfExists('contract_types');
    }
};
