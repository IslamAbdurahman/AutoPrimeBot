<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'user' => $request->user(),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:users,phone,'.$user->id,
            'telegram_id' => 'nullable|string|unique:users,telegram_id,'.$user->id,
            'current_password' => 'nullable|string',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        if (!empty($validated['password'])) {
            if (!Hash::check($validated['current_password'] ?? '', $user->password)) {
                return redirect()->back()->withErrors([
                    'current_password' => 'Joriy parol noto\'g\'ri kiritildi.',
                ]);
            }
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        unset($validated['current_password']);

        $user->update($validated);

        return redirect()->back();
    }
}
