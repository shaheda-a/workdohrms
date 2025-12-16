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
        Schema::create('salary_slips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->string('slip_reference')->unique();
            $table->string('salary_period'); // Format: YYYY-MM
            $table->decimal('basic_salary', 12, 2);
            
            // Earnings (stored as JSON for flexibility)
            $table->json('benefits_breakdown')->nullable();
            $table->json('incentives_breakdown')->nullable();
            $table->json('bonus_breakdown')->nullable();
            $table->json('overtime_breakdown')->nullable();
            $table->json('contributions_breakdown')->nullable();

            // Deductions
            $table->json('deductions_breakdown')->nullable();
            $table->json('advances_breakdown')->nullable();
            $table->json('tax_breakdown')->nullable();

            // Totals
            $table->decimal('total_earnings', 12, 2);
            $table->decimal('total_deductions', 12, 2);
            $table->decimal('net_payable', 12, 2);

            $table->enum('status', ['draft', 'generated', 'sent', 'paid'])->default('draft');
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->unsignedBigInteger('author_id')->nullable();
            $table->timestamps();

            $table->unique(['staff_member_id', 'salary_period']);
            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_slips');
    }
};
