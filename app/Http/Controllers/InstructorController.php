<?php

namespace App\Http\Controllers;

use App\Models\Driving;
use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorController extends Controller
{
    /**
     * Show the instructor dashboard.
     */
    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        
        // Load groups assigned to this instructor
        $groups = Group::withCount('students')
            ->where('instructor_id', $user->id)
            ->get();

        // Load upcoming drivings
        $upcomingDrivings = Driving::with(['student', 'group'])
            ->where('instructor_id', $user->id)
            ->where('status', 'scheduled')
            ->orderBy('start_time', 'asc')
            ->take(10)
            ->get();

        return Inertia::render('Instructor/Dashboard', [
            'groups' => $groups,
            'upcomingDrivings' => $upcomingDrivings,
        ]);
    }

    /**
     * Show the form for creating a new driving lesson.
     */
    public function createDriving(Request $request): Response
    {
        $user = $request->user();
        
        // Load groups with students for the select dropdowns
        $groups = Group::with('students')
            ->where('instructor_id', $user->id)
            ->get();

        return Inertia::render('Instructor/CreateDriving', [
            'groups' => $groups,
        ]);
    }

    /**
     * Store a newly created driving lesson.
     */
    public function storeDriving(Request $request)
    {
        $request->validate([
            'group_id' => 'required|exists:groups,id',
            'student_id' => 'required|exists:students,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        $user = $request->user();

        Driving::create([
            'instructor_id' => $user->id,
            'group_id' => $request->group_id,
            'student_id' => $request->student_id,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => 'scheduled',
        ]);

        return redirect()->route('instructor.dashboard');
    }
}
