<?php

use App\Models\Branch;
use App\Models\User;

test('superadmin can view branches page', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin', 'branch_id' => null]);

    $response = $this->actingAs($superadmin)->get('/admin/branches');

    $response->assertOk();
});

test('superadmin can create branch', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin', 'branch_id' => null]);

    $response = $this->actingAs($superadmin)->post('/admin/branches', [
        'name' => 'Chilonzor Filiali',
        'code' => 'chilonzor',
        'phone' => '+998901234567',
        'address' => 'Chilonzor 19',
        'status' => 'active',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('branches', [
        'code' => 'chilonzor',
        'name' => 'Chilonzor Filiali',
    ]);
});

test('admin cannot delete main branch', function () {
    $superadmin = User::factory()->create(['role' => 'superadmin', 'branch_id' => null]);
    $mainBranch = Branch::firstOrCreate(['code' => 'main'], ['name' => 'Asosiy Filial', 'status' => 'active']);

    $response = $this->actingAs($superadmin)->delete("/admin/branches/{$mainBranch->id}");

    $response->assertRedirect();
    $this->assertDatabaseHas('branches', ['id' => $mainBranch->id]);
});
