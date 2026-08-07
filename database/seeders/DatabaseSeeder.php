<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1 Admin
        User::create([
            'name' => 'Admin To\'raqulov',
            'phone' => '+998911157709',
            'password' => Hash::make('12345678'),
            'telegram_id' => '111111111',
            'role' => 'admin',
        ]);
    }
}
