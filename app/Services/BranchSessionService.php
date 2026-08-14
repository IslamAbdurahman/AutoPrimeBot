<?php

namespace App\Services;

use Illuminate\Http\Request;

class BranchSessionService
{
    /**
     * Get the active branch ID for the current request,
     * maintaining session persistence for superadmins across navigation.
     */
    public static function getActiveBranchId(Request $request): ?string
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        // Branch admins and instructors are restricted to their assigned branch
        if ($user->branch_id && in_array($user->role, ['admin', 'instructor'])) {
            return (string) $user->branch_id;
        }

        // Superadmins (or users without fixed branch_id) can select/switch branches
        if ($request->has('branch_id')) {
            $branchId = $request->input('branch_id');
            if ($branchId !== null && $branchId !== '' && $branchId !== 'all') {
                session(['selected_branch_id' => (string) $branchId]);

                return (string) $branchId;
            }

            session()->forget('selected_branch_id');

            return null;
        }

        return session('selected_branch_id') ? (string) session('selected_branch_id') : null;
    }
}
