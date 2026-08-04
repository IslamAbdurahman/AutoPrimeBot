<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InstructorController as AdminInstructorController;
use App\Http\Controllers\Admin\GroupController;
use App\Http\Controllers\Admin\StudentController;
use App\Http\Controllers\Admin\DrivingController;
use App\Http\Controllers\InstructorController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// For testing outside Telegram locally, we can bypass auth by adding `?test_telegram_id=111111111` for Admin
// or `?test_telegram_id=222222222` for Instructor if local environment logic is enabled in middleware.

// Starter kit dummy routes to satisfy Wayfinder / SSR build
Route::get('/settings/profile', function () {})->name('profile.edit');
Route::get('/settings/security', function () {})->name('security.edit');
Route::get('/settings/appearance', function () {})->name('appearance.edit');
Route::get('/dashboard', function () {})->name('dashboard');
Route::get('/home', function () {})->name('home');

Route::middleware(['auth.telegram'])->group(function () {
    // Instructor Routes
    Route::get('/instructor/dashboard', [InstructorController::class, 'dashboard'])->name('instructor.dashboard');
    Route::get('/instructor/driving/create', [InstructorController::class, 'createDriving'])->name('instructor.driving.create');
    Route::post('/instructor/driving', [InstructorController::class, 'storeDriving'])->name('instructor.driving.store');
    
    // Admin Routes
    Route::get('/admin/kpi', [DashboardController::class, 'kpiDashboard'])->name('admin.kpi');
    Route::resource('admin/instructors', AdminInstructorController::class)->except(['create', 'show', 'edit']);
    Route::resource('admin/groups', GroupController::class)->except(['create', 'show', 'edit']);
    Route::resource('admin/students', StudentController::class)->except(['create', 'show', 'edit']);
    Route::resource('admin/drivings', DrivingController::class)->except(['create', 'show', 'edit']);
});
