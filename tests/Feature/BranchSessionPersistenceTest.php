<?php

use App\Models\Branch;
use App\Models\Group;
use App\Models\Student;
use App\Models\User;

test('superadmin selected branch is persisted in session across page requests', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin', 'branch_id' => null]);

    $branch1 = Branch::firstOrCreate(['code' => 'b1'], ['name' => 'Filial 1', 'status' => 'active']);
    $branch2 = Branch::firstOrCreate(['code' => 'b2'], ['name' => 'Filial 2', 'status' => 'active']);

    $group1 = Group::factory()->create(['branch_id' => $branch1->id, 'name' => 'Group B1']);
    $group2 = Group::factory()->create(['branch_id' => $branch2->id, 'name' => 'Group B2']);

    $student1 = Student::factory()->create(['branch_id' => $branch1->id, 'group_id' => $group1->id, 'full_name' => 'Student B1']);
    $student2 = Student::factory()->create(['branch_id' => $branch2->id, 'group_id' => $group2->id, 'full_name' => 'Student B2']);

    // 1. Superadmin selects branch 2 on students page
    $response = $this->actingAs($superadmin)->get("/admin/students?branch_id={$branch2->id}");
    $response->assertOk();
    $response->assertSessionHas('selected_branch_id', (string) $branch2->id);

    // 2. Superadmin navigates to groups page with session carrying over branch_id=2
    $groupsResponse = $this->actingAs($superadmin)
        ->withSession(['selected_branch_id' => (string) $branch2->id])
        ->get('/admin/groups');
    $groupsResponse->assertOk();
    $groupsInertia = $groupsResponse->inertiaProps();
    expect($groupsInertia['filters']['branch_id'])->toBe((string) $branch2->id);

    // 3. Superadmin clears branch selection by setting branch_id to empty
    $clearResponse = $this->actingAs($superadmin)
        ->withSession(['selected_branch_id' => (string) $branch2->id])
        ->get('/admin/groups?branch_id=');
    $clearResponse->assertOk();
    $clearResponse->assertSessionMissing('selected_branch_id');

    // 4. Subsequent page request shows all branches
    $allGroupsResponse = $this->actingAs($superadmin)->get('/admin/groups');
    $allGroupsInertia = $allGroupsResponse->inertiaProps();
    expect($allGroupsInertia['filters']['branch_id'])->toBeNull();
});

test('branch admin is restricted to their assigned branch regardless of session or query params', function () {
    $branch1 = Branch::firstOrCreate(['code' => 'b1'], ['name' => 'Filial 1', 'status' => 'active']);
    $branch2 = Branch::firstOrCreate(['code' => 'b2'], ['name' => 'Filial 2', 'status' => 'active']);

    $admin1 = User::factory()->create(['role' => 'admin', 'branch_id' => $branch1->id]);

    $response = $this->actingAs($admin1)->get("/admin/students?branch_id={$branch2->id}");
    $response->assertOk();
    $props = $response->inertiaProps();
    expect($props['filters']['branch_id'])->toBe((string) $branch1->id);
});
