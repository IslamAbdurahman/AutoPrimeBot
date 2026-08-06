<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    private function authorizeSuperAdmin(Request $request): void
    {
        if ($request->user()->id !== 1) {
            abort(403, 'Ushbu sahifaga faqat Asosiy Admin kirishi mumkin.');
        }
    }

    public function index(Request $request): Response
    {
        $this->authorizeSuperAdmin($request);

        $query = User::where('role', 'admin')->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 10);
        if ($perPage === 'all') {
            $perPage = max($query->count(), 1);
        }

        $admins = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Admins/Index', [
            'admins' => $admins,
            'filters' => [
                'search' => $request->search,
                'per_page' => $request->per_page,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:users',
            'telegram_id' => 'nullable|string|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $validated['role'] = 'admin';
        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, User $admin)
    {
        $this->authorizeSuperAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:users,phone,'.$admin->id,
            'telegram_id' => 'nullable|string|unique:users,telegram_id,'.$admin->id,
            'password' => 'nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $admin->update($validated);

        return redirect()->back();
    }

    public function destroy(User $admin, Request $request)
    {
        $this->authorizeSuperAdmin($request);

        if ($request->user()->id === $admin->id) {
            return redirect()->back()->withErrors(['message' => 'O\'z hisobingizni o\'chira olmaysiz.']);
        }

        $admin->delete();

        return redirect()->back();
    }
}
