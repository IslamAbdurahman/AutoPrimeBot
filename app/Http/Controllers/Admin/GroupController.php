<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Imports\StudentsImport;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Facades\Excel;

class GroupController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isInstructor = $user->role === 'instructor';

        $query = Group::with('instructor')->orderBy('id', 'desc');

        if ($isInstructor) {
            $query->where('instructor_id', $user->id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('instructor_id') && ! $isInstructor) {
            $query->where('instructor_id', $request->instructor_id);
        }

        $perPage = $request->get('per_page', 15);
        if ($perPage === 'all') {
            $perPage = max($query->count(), 1);
        }

        $groups = $query->paginate($perPage)->withQueryString();

        $instructors = User::where('role', 'instructor')
            ->when($isInstructor, function ($q) use ($user) {
                $q->where('id', $user->id);
            })
            ->get();

        return Inertia::render('Admin/Groups/Index', [
            'groups' => $groups,
            'instructors' => $instructors,
            'filters' => [
                'search' => $request->search,
                'instructor_id' => $request->instructor_id,
                'per_page' => $request->per_page,
            ],
        ]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'instructor_id' => 'nullable|exists:users,id',
        ]);

        Group::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Group $group)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'instructor_id' => 'nullable|exists:users,id',
        ]);

        $group->update($validated);

        return redirect()->back();
    }

    public function destroy(Group $group, Request $request)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $group->delete();

        return redirect()->back();
    }

    public function show(Request $request, Group $group): Response
    {
        $user = $request->user();
        if ($user->role === 'instructor' && $group->instructor_id !== $user->id) {
            abort(403, 'Siz faqat o\'zingizga biriktirilgan guruhlarni ko\'rishingiz mumkin.');
        }

        $group->load('instructor');

        $students = $group->students()
            ->withCount(['drivings as completed_drivings_count' => function ($q) {
                $q->where('status', 'completed');
            }])
            ->orderBy('full_name')
            ->get();

        return Inertia::render('Admin/Groups/Show', [
            'group' => $group,
            'students' => $students,
        ]);
    }

    public function downloadTemplate()
    {
        $export = new class implements FromArray
        {
            public function array(): array
            {
                return [
                    ['full_name', 'phone', 'gender'],
                    ['Eshmatov Toshmat', '+998901234567', 'Erkak'],
                    ['Toshmatova Eshmatxon', '+998901234568', 'Ayol'],
                ];
            }
        };

        return Excel::download($export, 'talabalar_shabloni.xlsx');
    }

    public function importStudents(Request $request, Group $group)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,xls',
        ]);

        $file = $request->file('file');

        $import = new StudentsImport($group->id);
        Excel::import($import, $file);

        return redirect()->back()->with('success', "{$import->importedCount} ta o'quvchi muvaffaqiyatli yuklandi");
    }
}
