<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'full_name' => $this->faker->name(),
            'phone' => '+9989' . $this->faker->unique()->numerify('########'),
            'telegram_id' => $this->faker->unique()->numerify('#########'),
            'status' => 'active',
        ];
    }
}
