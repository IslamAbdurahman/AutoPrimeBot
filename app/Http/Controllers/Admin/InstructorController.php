<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::where('role', 'instructor')->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $instructors = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Instructors/Index', [
            'instructors' => $instructors,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:users',
            'telegram_id' => 'nullable|string|unique:users',
        ]);

        User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'telegram_id' => $validated['telegram_id'],
            'role' => 'instructor',
        ]);

        return redirect()->back();
    }

    public function update(Request $request, User $instructor)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:users,phone,' . $instructor->id,
            'telegram_id' => 'nullable|string|unique:users,telegram_id,' . $instructor->id,
        ]);

        $instructor->update($validated);

        return redirect()->back();
    }

    public function destroy(User $instructor)
    {
        $instructor->delete();
        return redirect()->back();
    }
}
