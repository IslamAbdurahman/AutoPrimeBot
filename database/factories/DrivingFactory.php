<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Driving>
 */
class DrivingFactory extends Factory
{
    public function definition(): array
    {
        $start = Carbon::now()->subDays(rand(1, 10))->setHour(rand(8, 16))->setMinute(0);
        return [
            'start_time' => $start,
            'end_time' => (clone $start)->addHours(2),
            'status' => 'completed',
        ];
    }
}
