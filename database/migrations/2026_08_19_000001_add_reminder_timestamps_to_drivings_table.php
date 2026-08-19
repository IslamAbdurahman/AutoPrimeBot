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
        Schema::table('drivings', function (Blueprint $table) {
            $table->timestamp('reminded_24h_at')->nullable()->after('status');
            $table->timestamp('reminded_2h_at')->nullable()->after('reminded_24h_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivings', function (Blueprint $table) {
            $table->dropColumn(['reminded_24h_at', 'reminded_2h_at']);
        });
    }
};
