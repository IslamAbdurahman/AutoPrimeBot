<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Group::with('instructor')->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('instructor_id')) {
            $query->where('instructor_id', $request->instructor_id);
        }

        $groups = $query->paginate(15)->withQueryString();
        
        $instructors = User::where('role', 'instructor')->get();

        return Inertia::render('Admin/Groups/Index', [
            'groups' => $groups,
            'instructors' => $instructors,
            'filters' => $request->only('search', 'instructor_id'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'instructor_id' => 'nullable|exists:users,id',
        ]);

        Group::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Group $group)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'instructor_id' => 'nullable|exists:users,id',
        ]);

        $group->update($validated);

        return redirect()->back();
    }

    public function destroy(Group $group)
    {
        $group->delete();
        return redirect()->back();
    }
}
