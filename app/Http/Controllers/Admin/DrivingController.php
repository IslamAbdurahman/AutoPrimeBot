<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Driving;
use App\Models\Group;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DrivingController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Driving::with(['instructor', 'student', 'group', 'review'])
            ->orderBy('start_time', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student', function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('instructor_id')) {
            $query->where('instructor_id', $request->instructor_id);
        }

        $drivings = $query->paginate(15)->withQueryString();
        $instructors = \App\Models\User::where('role', 'instructor')->get();

        $studentsQuery = Student::orderBy('full_name');
        $groupsQuery = Group::orderBy('name');

        if ($request->user()->role === 'instructor') {
            $groupsQuery->where('instructor_id', $request->user()->id);
            $studentsQuery->whereHas('group', function ($q) use ($request) {
                $q->where('instructor_id', $request->user()->id);
            });
        }

        $students = $studentsQuery->get();
        $groups = $groupsQuery->get();

        return Inertia::render('Admin/Drivings/Index', [
            'drivings' => $drivings,
            'instructors' => $instructors,
            'students' => $students,
            'groups' => $groups,
            'filters' => $request->only('search', 'status', 'instructor_id'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'instructor_id' => 'required|exists:users,id',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'group_id' => 'nullable|exists:groups,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        foreach ($validated['student_ids'] as $studentId) {
            Driving::create([
                'instructor_id' => $validated['instructor_id'],
                'student_id' => $studentId,
                'group_id' => $validated['group_id'] ?? null,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'status' => 'scheduled',
            ]);
        }

        return redirect()->back();
    }

    public function update(Request $request, Driving $driving)
    {
        $validated = $request->validate([
            'instructor_id' => 'required|exists:users,id',
            'student_id' => 'required|exists:students,id',
            'group_id' => 'nullable|exists:groups,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
        ]);

        $driving->update($validated);

        return redirect()->back();
    }

    public function destroy(Driving $driving)
    {
        $driving->delete();
        return redirect()->back();
    }
}
