<?php

namespace App\Services;

use Illuminate\Http\Request;

class BranchSessionService
{
    /**
     * Get the active branch ID for the current request,
     * maintaining session persistence for superadmins across navigation.
     */
    public static function getActiveBranchId(?Request $request = null): ?string
    {
        $user = $request ? $request->user() : auth()->user();
        if (! $user) {
            return null;
        }

        $isSuperAdmin = $user->role === 'superadmin' || $user->id === 1;

        // Subordinate branch admins and instructors are restricted to their assigned branch
        if (! $isSuperAdmin && $user->branch_id && in_array($user->role, ['admin', 'instructor'])) {
            return (string) $user->branch_id;
        }

        // Superadmins (or users with global rights) can select/switch branches
        if ($request && $request->has('branch_id')) {
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
