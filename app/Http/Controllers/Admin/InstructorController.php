<?php

namespace App\Http\Controllers\Admin;

use App\Exports\InstructorsExport;
use App\Http\Controllers\Controller;
use App\Models\Driving;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class InstructorController extends Controller
{
    public function export(Request $request)
    {
        return Excel::download(new InstructorsExport($request->all()), 'instruktorlar.xlsx');
    }

    public function index(Request $request): Response
    {
        $query = User::where('role', 'instructor')->orderBy('id', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('car_name', 'like', "%{$search}%");
            });
        }

        $from = $request->input('from', Carbon::now()->startOfMonth()->format('d-m-Y'));
        $to = $request->input('to', Carbon::now()->format('d-m-Y'));

        $drivingsQuery = function ($query) use ($from, $to) {
            $query->with('review');
            if ($from) {
                try {
                    $fromDate = preg_match('/^\d{2}-\d{2}-\d{4}$/', $from)
                        ? Carbon::createFromFormat('d-m-Y', $from)->startOfDay()
                        : Carbon::parse($from)->startOfDay();
                    $query->where('start_time', '>=', $fromDate);
                } catch (\Exception $e) {
                }
            }
            if ($to) {
                try {
                    $toDate = preg_match('/^\d{2}-\d{2}-\d{4}$/', $to)
                        ? Carbon::createFromFormat('d-m-Y', $to)->endOfDay()
                        : Carbon::parse($to)->endOfDay();
                    $query->where('start_time', '<=', $toDate);
                } catch (\Exception $e) {
                }
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
            $completedDrivings = $instructor->drivings->where('status', 'completed')->count();
            $scheduledDrivings = $instructor->drivings->where('status', 'scheduled')->count();

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

            $isLowRating = $totalReviews > 0 && $averageRating <= 3;
            $needsAttention = $isLowRating || $negativeTagsCount >= 3;

            return [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'phone' => $instructor->phone,
                'telegram_id' => $instructor->telegram_id,
                'car_name' => $instructor->car_name,
                'photo_url' => $instructor->photo_url,
                'groups_count' => $instructor->groups_count,
                'students_count' => $studentsCount,
                'total_drivings' => $totalDrivings,
                'completed_drivings' => $completedDrivings,
                'scheduled_drivings' => $scheduledDrivings,
                'reviewed_drivings' => $totalReviews,
                'total_score' => $totalScore,
                'average_rating' => $averageRating > 0 ? round($averageRating, 2) : 0,
                'kpi_percentage' => round($kpiPercentage, 1),
                'negative_tags_count' => $negativeTagsCount,
                'is_low_rating' => $isLowRating,
                'needs_attention' => $needsAttention,
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

    public function show(Request $request, User $instructor): Response
    {
        $instructor->loadCount('groups');

        $drivings = Driving::with(['student.group', 'autodrome', 'review'])
            ->where('instructor_id', $instructor->id)
            ->orderBy('start_time', 'desc')
            ->get();

        $reviews = $drivings->pluck('review')->filter();
        $totalReviews = $reviews->count();
        $totalScore = (int) $reviews->sum('rating');
        $maxScore = $totalReviews * 5;
        $averageRating = $totalReviews > 0 ? round($reviews->avg('rating'), 2) : 0;
        $kpiPercentage = $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 1) : 0;

        $allTags = $reviews->pluck('reason_tags')->flatten()->filter()->values();
        $tagCounts = $allTags->countBy()->map(function ($count, $tag) use ($totalReviews) {
            return [
                'tag' => $tag,
                'count' => $count,
                'percentage' => $totalReviews > 0 ? round(($count / $totalReviews) * 100, 1) : 0,
            ];
        })->values()->sortByDesc('count')->values();

        $ratingDistribution = [];
        for ($star = 5; $star >= 1; $star--) {
            $count = $reviews->where('rating', $star)->count();
            $ratingDistribution[] = [
                'stars' => $star,
                'count' => $count,
                'percentage' => $totalReviews > 0 ? round(($count / $totalReviews) * 100, 1) : 0,
            ];
        }

        return Inertia::render('Admin/Instructors/Show', [
            'instructor' => [
                'id' => $instructor->id,
                'name' => $instructor->name,
                'phone' => $instructor->phone,
                'telegram_id' => $instructor->telegram_id,
                'car_name' => $instructor->car_name,
                'photo_url' => $instructor->photo_url,
                'groups_count' => $instructor->groups_count,
            ],
            'stats' => [
                'total_drivings' => $drivings->count(),
                'completed_drivings' => $drivings->where('status', 'completed')->count(),
                'scheduled_drivings' => $drivings->where('status', 'scheduled')->count(),
                'cancelled_drivings' => $drivings->where('status', 'cancelled')->count(),
                'total_reviews' => $totalReviews,
                'average_rating' => $averageRating,
                'kpi_percentage' => $kpiPercentage,
                'tag_counts' => $tagCounts,
                'rating_distribution' => $ratingDistribution,
            ],
            'drivings' => $drivings,
        ]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:users',
            'telegram_id' => 'nullable|string|unique:users',
            'car_name' => 'nullable|string|max:255',
            'photo' => 'nullable|image|max:5120',
            'password' => 'nullable|string|min:6',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('instructors', 'public');
        }

        User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'telegram_id' => $validated['telegram_id'] ?? null,
            'car_name' => $validated['car_name'] ?? null,
            'photo_path' => $photoPath,
            'password' => ! empty($validated['password']) ? Hash::make($validated['password']) : Hash::make(Str::random(16)),
            'role' => 'instructor',
        ]);

        return redirect()->back();
    }

    public function update(Request $request, User $instructor)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:users,phone,'.$instructor->id,
            'telegram_id' => 'nullable|string|unique:users,telegram_id,'.$instructor->id,
            'car_name' => 'nullable|string|max:255',
            'photo' => 'nullable|image|max:5120',
            'password' => 'nullable|string|min:6',
        ]);

        if ($request->hasFile('photo')) {
            if ($instructor->photo_path) {
                Storage::disk('public')->delete($instructor->photo_path);
            }
            $validated['photo_path'] = $request->file('photo')->store('instructors', 'public');
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $instructor->update($validated);

        return redirect()->back();
    }

    public function destroy(User $instructor, Request $request)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        if ($instructor->photo_path) {
            Storage::disk('public')->delete($instructor->photo_path);
        }

        $instructor->delete();

        return redirect()->back();
    }
}
