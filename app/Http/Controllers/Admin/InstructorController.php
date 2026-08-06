<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
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
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $from = $request->input('from', Carbon::now()->startOfMonth()->format('d-m-Y'));
        $to = $request->input('to', Carbon::now()->format('d-m-Y'));

        $drivingsQuery = function ($query) use ($from, $to) {
            $query->with('review');
            try {
                $fromDate = Carbon::createFromFormat('d-m-Y', $from)->startOfDay();
                $query->where('start_time', '>=', $fromDate);
            } catch (\Exception $e) {
            }
            try {
                $toDate = Carbon::createFromFormat('d-m-Y', $to)->endOfDay();
                $query->where('start_time', '<=', $toDate);
            } catch (\Exception $e) {
            }
        };

        $perPage = $request->get('per_page', 15);
        if ($perPage === 'all') {
            $perPage = max($query->count(), 1);
        }

        $instructors = $query->withCount('groups')
            ->with([
                'groups' => fn ($gQuery) => $gQuery->withCount('students'),
                'drivings' => $drivingsQuery,
            ])
            ->paginate($perPage)
            ->withQueryString();

        $instructors->getCollection()->transform(function ($instructor) {
            $studentsCount = $instructor->groups->sum('students_count');
            $totalDrivings = $instructor->drivings->count();

            $reviews = $instructor->drivings->pluck('review')->filter();
            $totalReviews = $reviews->count();
            $totalScore = (int) $reviews->sum('rating');
            $maxScore = $totalReviews * 5;

            $averageRating = $totalReviews > 0 ? $reviews->avg('rating') : 0;
            $kpiPercentage = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;

            $allTags = $reviews->pluck('reason_tags')->flatten()->filter();

            $negativeTagsCount = $allTags->filter(function ($tag) {
                return in_array($tag, ['⏰ Kechikdi', '🗣 Muomala yomon', '🚗 Mashina nosoz', '⏳ Vaqtidan kam o\'tildi']);
            })->count();

            return [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'phone' => $instructor->phone,
                'telegram_id' => $instructor->telegram_id,
                'groups_count' => $instructor->groups_count,
                'students_count' => $studentsCount,
                'total_drivings' => $totalDrivings,
                'reviewed_drivings' => $totalReviews,
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'score_formatted' => "{$totalScore}/{$maxScore}",
                'average_rating' => round($averageRating, 2),
                'kpi_percentage' => round($kpiPercentage, 1),
                'negative_tags_count' => $negativeTagsCount,
                'needs_attention' => $negativeTagsCount >= 3,
            ];
        });

        return Inertia::render('Admin/Instructors/Index', [
            'instructors' => $instructors,
            'filters' => [
                'search' => $request->search,
                'from' => $from,
                'to' => $to,
                'per_page' => $request->per_page,
            ],
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
            'phone' => 'required|string|max:20|unique:users,phone,'.$instructor->id,
            'telegram_id' => 'nullable|string|unique:users,telegram_id,'.$instructor->id,
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
