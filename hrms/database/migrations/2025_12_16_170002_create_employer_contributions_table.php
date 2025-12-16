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
        Schema::create('employer_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_member_id')->constrained('staff_members')->cascadeOnDelete();
            $table->string('title');
            $table->enum('contribution_type', ['fixed', 'percentage'])->default('fixed');
            $table->decimal('amount', 12, 2);
            $table->date('effective_from')->nullable();
            $table->date('effective_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->unsignedBigInteger('author_id')->nullable();
            $table->timestamps();

            $table->foreign('author_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employer_contributions');
    }
};
