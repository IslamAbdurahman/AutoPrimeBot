<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Driving;
use App\Models\Review;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $to = $request->input('to', Carbon::now()->format('Y-m-d'));

        $fromDate = Carbon::now()->startOfMonth();
        $toDate = Carbon::now()->endOfDay();
        if ($from) {
            try {
                $fromDate = Carbon::parse($from)->startOfDay();
            } catch (\Exception $e) {
            }
        }
        if ($to) {
            try {
                $toDate = Carbon::parse($to)->endOfDay();
            } catch (\Exception $e) {
            }
        }

        $user = $request->user();
        $isInstructor = $user->role === 'instructor';

        $totalStudents = Student::when($isInstructor, function ($query) use ($user) {
            $query->whereHas('group', function ($q) use ($user) {
                $q->where('instructor_id', $user->id);
            });
        })->count();

        // Ensure reviews only belong to drivings taught by this instructor
        $periodAvgRating = Review::whereBetween('created_at', [$fromDate, $toDate])
            ->when($isInstructor, function ($query) use ($user) {
                $query->whereHas('driving', function ($q) use ($user) {
                    $q->where('instructor_id', $user->id);
                });
            })
            ->avg('rating') ?? 0;

        $periodKpi = round(($periodAvgRating / 5) * 100, 1);

        $drivingsQuery = Driving::whereBetween('start_time', [$fromDate, $toDate])
            ->when($isInstructor, function ($query) use ($user) {
                $query->where('instructor_id', $user->id);
            });

        $periodDrivingsCount = (clone $drivingsQuery)->count();

        $completedPeriodDrivings = (clone $drivingsQuery)
            ->where('status', 'completed')
            ->count();

        $completionRate = $periodDrivingsCount > 0
            ? round(($completedPeriodDrivings / $periodDrivingsCount) * 100, 1)
            : 0;

        $drivingsInPeriod = (clone $drivingsQuery)->get();

        $chartData = [];
        $currentDate = $fromDate->copy();

        // Limit to prevent huge arrays if user selects a massive range
        $maxDays = 90;
        $daysAdded = 0;

        while ($currentDate->lte($toDate) && $daysAdded < $maxDays) {
            $dateStr = $currentDate->format('d-m-Y');

            $dayDrivings = $drivingsInPeriod->filter(function ($d) use ($dateStr) {
                return Carbon::parse($d->start_time)->format('d-m-Y') === $dateStr;
            });

            $chartData[] = [
                'date' => $dateStr,
                'Rejada' => $dayDrivings->where('status', 'scheduled')->count(),
                'Tugagan' => $dayDrivings->where('status', 'completed')->count(),
                'Bekor_qilingan' => $dayDrivings->where('status', 'cancelled')->count(),
            ];

            $currentDate->addDay();
            $daysAdded++;
        }

        return Inertia::render('Admin/Dashboard/Index', [
            'metrics' => [
                'totalStudents' => $totalStudents,
                'todayKpi' => $periodKpi,
                'monthlyDrivingsCount' => $periodDrivingsCount,
                'completionRate' => $completionRate,
            ],
            'chartData' => $chartData,
            'filters' => [
                'from' => $from,
                'to' => $to,
            ],
        ]);
    }
}
