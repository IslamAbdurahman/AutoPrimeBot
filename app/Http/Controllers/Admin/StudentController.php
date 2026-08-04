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

    public function destroy(Student $student)
    {
        $student->delete();

        return redirect()->back();
    }
}
