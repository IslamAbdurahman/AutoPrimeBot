<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the admin KPI dashboard.
     */
    public function kpiDashboard(Request $request): Response
    {
        // Load instructors with their groups, drivings, and reviews
        $instructors = User::where('role', 'instructor')
            ->withCount('groups')
            ->with(['drivings' => function ($query) {
                $query->with('review');
            }])
            ->get();

        $kpiData = $instructors->map(function ($instructor) {
            $totalDrivings = $instructor->drivings->count();
            
            $reviews = $instructor->drivings->pluck('review')->filter();
            $totalReviews = $reviews->count();
            
            $averageRating = $totalReviews > 0 ? $reviews->avg('rating') : 0;
            $kpiPercentage = ($averageRating / 5) * 100;

            // Collect all reason tags and flatten them
            $allTags = $reviews->pluck('reason_tags')->flatten()->filter();
            
            // Count negative tags (assuming rating <= 3 produces these specific tags)
            $negativeTagsCount = $allTags->filter(function ($tag) {
                return in_array($tag, ['⏰ Kechikdi', '🗣 Muomala yomon', '🚗 Mashina nosoz', '⏳ Vaqtidan kam o\'tildi']);
            })->count();

            return [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'phone' => $instructor->phone,
                'groups_count' => $instructor->groups_count,
                'total_drivings' => $totalDrivings,
                'total_reviews' => $totalReviews,
                'average_rating' => round($averageRating, 2),
                'kpi_percentage' => round($kpiPercentage, 1),
                'negative_tags_count' => $negativeTagsCount,
                'needs_attention' => $negativeTagsCount >= 3,
            ];
        })->sortByDesc('kpi_percentage')->values();

        return Inertia::render('Admin/KPI', [
            'instructors' => $kpiData,
        ]);
    }
}
