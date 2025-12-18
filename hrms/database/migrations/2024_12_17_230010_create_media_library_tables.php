<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Media Directories
        if (!Schema::hasTable('media_directories')) {
            Schema::create('media_directories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->foreignId('parent_id')->nullable()->constrained('media_directories')->onDelete('cascade');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('path')->nullable();
                $table->timestamps();
            });
        }

        // Media Files
        if (!Schema::hasTable('media_files')) {
            Schema::create('media_files', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->foreignId('directory_id')->nullable()->constrained('media_directories')->onDelete('cascade');
                $table->string('file_path');
                $table->string('file_type')->nullable();
                $table->string('mime_type')->nullable();
                $table->bigInteger('file_size')->nullable();
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->boolean('is_shared')->default(false);
                $table->json('shared_with')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('media_files');
        Schema::dropIfExists('media_directories');
    }
};
