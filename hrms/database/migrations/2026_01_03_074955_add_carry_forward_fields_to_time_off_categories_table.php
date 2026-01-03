<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('time_off_categories', function (Blueprint $table) {
        $table->boolean('is_carry_forward_allowed')->default(false) ->after('is_active');
        $table->integer('max_carry_forward_days')->nullable()->default(0) ->after('is_carry_forward_allowed');
    });
}

public function down()
{
    Schema::table('time_off_categories', function (Blueprint $table) {
        $table->dropColumn(['is_carry_forward_allowed', 'max_carry_forward_days']);
    });
}
};
