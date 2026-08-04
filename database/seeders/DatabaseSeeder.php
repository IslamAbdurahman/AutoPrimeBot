<?php

namespace Database\Seeders;

use App\Models\Driving;
use App\Models\Group;
use App\Models\Review;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1 Admin
        User::factory()->create([
            'name' => 'Admin To\'raqulov',
            'phone' => '+998911157709',
            'telegram_id' => '111111111',
            'role' => 'admin',
        ]);

        // 3 Instructors
        $instructors = collect([
            User::factory()->create([
                'name' => 'Sobirjon Instruktor',
                'phone' => '+998901112233',
                'telegram_id' => '222222222',
                'role' => 'instructor',
            ]),
            User::factory()->create([
                'name' => 'Qodirali Instruktor',
                'phone' => '+998902223344',
                'telegram_id' => '333333333',
                'role' => 'instructor',
            ]),
            User::factory()->create([
                'name' => 'Dilshod Instruktor',
                'phone' => '+998903334455',
                'telegram_id' => '444444444',
                'role' => 'instructor',
            ]),
        ]);

        // 6 Groups
        $groups = collect();
        foreach ($instructors as $instructor) {
            $groups->push(Group::factory()->create([
                'name' => 'Guruh-A1-'.$instructor->id,
                'instructor_id' => $instructor->id,
            ]));
            $groups->push(Group::factory()->create([
                'name' => 'Guruh-B2-'.$instructor->id,
                'instructor_id' => $instructor->id,
            ]));
        }

        // 30 Students (5 per group)
        $students = collect();
        foreach ($groups as $group) {
            for ($i = 0; $i < 5; $i++) {
                $students->push(Student::factory()->create([
                    'group_id' => $group->id,
                    'phone' => '+99893'.fake()->unique()->numerify('#######'),
                    'telegram_id' => fake()->unique()->numerify('#########'),
                ]));
            }
        }

        // 50 Drivings
        $drivings = collect();
        for ($i = 0; $i < 50; $i++) {
            $student = $students->random();
            $instructor = $student->group->instructor;
            $start = Carbon::now()->subDays(rand(1, 30))->setHour(rand(8, 16))->setMinute(0)->setSecond(0);

            $drivings->push(Driving::factory()->create([
                'instructor_id' => $instructor->id,
                'group_id' => $student->group_id,
                'student_id' => $student->id,
                'start_time' => $start,
                'end_time' => (clone $start)->addHours(2),
                'status' => 'completed',
            ]));
        }

        // 40 Reviews
        foreach ($drivings->take(40) as $driving) {
            $rating = rand(1, 5);
            $tags = [];

            if ($rating >= 4) {
                $possibleTags = ['🧠 Zargona tushuntirdi', '✨ Xushmuomala', '🧼 Mashina toza', '⏰ Vaqtida boshladi'];
                $tags = fake()->randomElements($possibleTags, rand(1, 3));
            } else {
                $possibleTags = ['⏰ Kechikdi', '🗣 Muomala yomon', '🚗 Mashina nosoz', '⏳ Vaqtidan kam o\'tildi'];
                $tags = fake()->randomElements($possibleTags, rand(1, 3));
            }

            Review::factory()->create([
                'driving_id' => $driving->id,
                'rating' => $rating,
                'reason_tags' => $tags,
            ]);
        }
    }
}
