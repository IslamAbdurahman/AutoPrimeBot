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
        $query = Student::with('group')->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('group_id')) {
            $query->where('group_id', $request->group_id);
        }

        $students = $query->paginate(15)->withQueryString();
        $groups = Group::all();

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
            'groups' => $groups,
            'filters' => $request->only('search', 'group_id'),
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
            'phone' => 'required|string|max:20|unique:students,phone,' . $student->id,
            'telegram_id' => 'nullable|string|unique:students,telegram_id,' . $student->id,
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
