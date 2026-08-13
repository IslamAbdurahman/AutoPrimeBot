<?php

use App\Models\Group;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Maatwebsite\Excel\Facades\Excel;

test('admin can upload excel file to import students into group', function () {
    Excel::fake();

    $admin = User::factory()->create(['role' => 'admin']);
    $group = Group::factory()->create();

    $file = UploadedFile::fake()->create('students.xlsx', 100, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    $response = $this->actingAs($admin)->post("/admin/groups/{$group->id}/import-students", [
        'file' => $file,
    ]);

    $response->assertRedirect();
    Excel::assertImported('students.xlsx');
});
