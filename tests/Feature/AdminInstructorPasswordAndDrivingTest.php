<?php

use App\Models\Autodrome;
use App\Models\Branch;
use App\Models\Driving;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admin can create instructor with password and update password', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $branch = Branch::firstOrCreate(['code' => 'test-branch'], ['name' => 'Test Branch', 'status' => 'active']);

    $response = $this->actingAs($admin)->post('/admin/instructors', [
        'name' => 'Jasur Instruktor',
        'phone' => '+998901112233',
        'branch_id' => $branch->id,
        'car_name' => 'Cobalt',
        'password' => 'secret123',
    ]);

    $response->assertRedirect();
    $instructor = User::where('phone', '+998901112233')->first();
    expect($instructor)->not->toBeNull()
        ->and($instructor->role)->toBe('instructor')
        ->and(Hash::check('secret123', $instructor->password))->toBeTrue();

    // Admin updates instructor password
    $updateResponse = $this->actingAs($admin)->put("/admin/instructors/{$instructor->id}", [
        'name' => 'Jasur Instruktor Yangilangan',
        'phone' => '+998901112233',
        'branch_id' => $branch->id,
        'car_name' => 'Cobalt 2',
        'password' => 'newsecret456',
    ]);

    $updateResponse->assertRedirect();
    $instructor->refresh();
    expect($instructor->name)->toBe('Jasur Instruktor Yangilangan')
        ->and(Hash::check('newsecret456', $instructor->password))->toBeTrue();
});

test('admin can complete driving without providing geolocation', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $instructor = User::factory()->create(['role' => 'instructor']);
    $student = Student::factory()->create();
    $autodrome = Autodrome::create([
        'name' => 'Test Avtodrom',
        'latitude' => 41.311081,
        'longitude' => 69.240562,
        'radius_meters' => 200,
        'is_active' => true,
    ]);

    $driving = Driving::create([
        'student_id' => $student->id,
        'instructor_id' => $instructor->id,
        'autodrome_id' => $autodrome->id,
        'start_time' => now()->subHour(),
        'end_time' => now(),
        'status' => 'scheduled',
    ]);

    // Admin completes the driving without coordinates
    $response = $this->actingAs($admin)->put("/admin/drivings/{$driving->id}", [
        'status' => 'completed',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    $driving->refresh();
    expect($driving->status)->toBe('completed');
});
