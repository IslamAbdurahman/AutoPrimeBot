<?php

namespace Database\Factories;

use App\Models\Driving;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Driving>
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
