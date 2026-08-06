<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isInstructor = $user->role === 'instructor';

        $query = Student::with('group')
            ->withCount(['drivings as completed_drivings_count' => function ($q) {
                $q->where('status', 'completed');
            }])
            ->orderBy('id', 'desc');

        if ($isInstructor) {
            $query->whereHas('group', function ($q) use ($user) {
                $q->where('instructor_id', $user->id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('group_id')) {
            $query->where('group_id', $request->group_id);
        }

        $perPage = $request->get('per_page', 15);
        if ($perPage === 'all') {
            $perPage = max($query->count(), 1);
        }

        $students = $query->paginate($perPage)->withQueryString();
        $groups = Group::when($isInstructor, function ($q) use ($user) {
            $q->where('instructor_id', $user->id);
        })->get();

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
            'groups' => $groups,
            'filters' => [
                'search' => $request->search,
                'group_id' => $request->group_id,
                'per_page' => $request->per_page,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:students',
            'telegram_id' => 'nullable|string|unique:students',
            'group_id' => 'nullable|exists:groups,id',
        ]);

        Student::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:students,phone,'.$student->id,
            'telegram_id' => 'nullable|string|unique:students,telegram_id,'.$student->id,
            'group_id' => 'nullable|exists:groups,id',
        ]);

        $student->update($validated);

        return redirect()->back();
    }

    public function show(Student $student, Request $request): Response
    {
        $student->load('group.instructor');

        $drivingsQuery = $student->drivings()
            ->with(['instructor', 'group', 'review'])
            ->orderBy('start_time', 'desc');

        if ($request->filled('status')) {
            $drivingsQuery->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 10);
        if ($perPage === 'all') {
            $perPage = max($drivingsQuery->count(), 1);
        }

        $drivings = $drivingsQuery->paginate($perPage)->withQueryString();

        $reviews = $student->drivings()->has('review')->with('review')->get()->pluck('review');
        $avgRating = $reviews->count() > 0 ? round($reviews->avg('rating'), 1) : 0;

        $stats = [
            'total_drivings' => $student->drivings()->count(),
            'completed_drivings' => $student->drivings()->where('status', 'completed')->count(),
            'scheduled_drivings' => $student->drivings()->where('status', 'scheduled')->count(),
            'cancelled_drivings' => $student->drivings()->where('status', 'cancelled')->count(),
            'average_rating' => $avgRating,
        ];

        return Inertia::render('Admin/Students/Show', [
            'student' => $student,
            'drivings' => $drivings,
            'stats' => $stats,
            'filters' => [
                'status' => $request->status,
                'per_page' => $request->per_page,
            ],
        ]);
    }

    public function destroy(Student $student)
    {
        $student->delete();

        return redirect()->back();
    }
}
