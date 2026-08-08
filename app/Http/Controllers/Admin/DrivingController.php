<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Autodrome;
use App\Models\Driving;
use App\Models\Group;
use App\Models\Student;
use App\Models\User;
use App\Services\TelegramService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DrivingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isInstructor = $user->role === 'instructor';

        $query = Driving::with(['instructor', 'student', 'group', 'review', 'autodrome'])
            ->orderBy('start_time', 'desc');

        if ($isInstructor) {
            $query->where('instructor_id', $user->id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $from = $request->input('from', Carbon::now()->startOfMonth()->format('d-m-Y'));
        $to = $request->input('to', Carbon::now()->format('d-m-Y'));

        if ($request->filled('instructor_id') && ! $isInstructor) {
            $query->where('instructor_id', $request->instructor_id);
        }

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

        $perPage = $request->get('per_page', 10);
        if ($perPage === 'all') {
            $perPage = max($query->count(), 1); // Avoid 0 per page
        }

        $drivings = $query->paginate($perPage)->withQueryString();
        $instructors = User::where('role', 'instructor')
            ->when($isInstructor, function ($q) use ($user) {
                $q->where('id', $user->id);
            })
            ->get();

        $studentsQuery = Student::orderBy('full_name');
        $groupsQuery = Group::orderBy('name');

        if ($request->user()->role === 'instructor') {
            $groupsQuery->where('instructor_id', $request->user()->id);
            $studentsQuery->whereHas('group', function ($q) use ($request) {
                $q->where('instructor_id', $request->user()->id);
            });
        }

        $students = $studentsQuery->get();
        $groups = $groupsQuery->get();
        $autodromes = Autodrome::orderBy('name')->get();

        return Inertia::render('Admin/Drivings/Index', [
            'drivings' => $drivings,
            'instructors' => $instructors,
            'students' => $students,
            'groups' => $groups,
            'autodromes' => $autodromes,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'instructor_id' => $request->instructor_id,
                'from' => $from,
                'to' => $to,
                'per_page' => $request->per_page,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'instructor_id' => 'required|exists:users,id',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'group_id' => 'nullable|exists:groups,id',
            'autodrome_id' => 'nullable|exists:autodromes,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        foreach ($validated['student_ids'] as $studentId) {
            $student = Student::find($studentId);
            $groupId = $student?->group_id ?? ($validated['group_id'] ?? null);

            $driving = Driving::create([
                'instructor_id' => $validated['instructor_id'],
                'student_id' => $studentId,
                'group_id' => $groupId,
                'autodrome_id' => $validated['autodrome_id'] ?? null,
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'status' => 'scheduled',
            ]);

            app(TelegramService::class)->sendDrivingCreatedNotification($driving);
        }

        return redirect()->back();
    }

    public function update(Request $request, Driving $driving)
    {
        if (in_array($driving->status, ['completed', 'cancelled'])) {
            return redirect()->back()->withErrors([
                'update' => 'Tugallangan yoki bekor qilingan mashg\'ulotni o\'zgartirish mumkin emas.',
            ]);
        }

        $validated = $request->validate([
            'autodrome_id' => 'nullable|exists:autodromes,id',
            'start_time' => 'sometimes|required|date',
            'end_time' => 'sometimes|required|date|after:start_time',
            'status' => 'sometimes|required|in:scheduled,completed,cancelled',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'completed') {
            $autodrome = $driving->autodrome ?? ($request->filled('autodrome_id') ? Autodrome::find($request->autodrome_id) : null);
            if ($autodrome && $autodrome->latitude && $autodrome->longitude) {
                if (! $request->filled('latitude') || ! $request->filled('longitude')) {
                    return redirect()->back()->withErrors([
                        'location' => 'Mashg\'ulotni yakunlash uchun geolokatsiya (GPS) yuborilishi shart.',
                    ]);
                }

                $distance = $this->haversineGreatCircleDistance(
                    (float) $request->latitude,
                    (float) $request->longitude,
                    (float) $autodrome->latitude,
                    (float) $autodrome->longitude
                );

                if ($distance > $autodrome->radius_meters) {
                    $distanceMeters = round($distance);

                    return redirect()->back()->withErrors([
                        'location' => "Siz avtodrom hududida emassiz. Masofangiz: {$distanceMeters} metr (Ruxsat etilgan: {$autodrome->radius_meters} metr).",
                    ]);
                }
            }
        }

        $oldStatus = $driving->status;
        $driving->update($validated);

        if ($oldStatus !== $driving->status) {
            if ($driving->status === 'completed') {
                app(TelegramService::class)->sendLessonRatingPrompt($driving);
            } elseif ($driving->status === 'cancelled') {
                app(TelegramService::class)->sendDrivingCancelledNotification($driving);
            }
        }

        return redirect()->back();
    }

    private function haversineGreatCircleDistance($latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo)
    {
        $earthRadius = 6371000; // Earth radius in meters

        $latFrom = deg2rad($latitudeFrom);
        $lonFrom = deg2rad($longitudeFrom);
        $latTo = deg2rad($latitudeTo);
        $lonTo = deg2rad($longitudeTo);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        return $angle * $earthRadius;
    }

    public function destroy(Driving $driving)
    {
        if (in_array($driving->status, ['completed', 'cancelled']) || $driving->review()->exists()) {
            return redirect()->back()->withErrors([
                'delete' => 'Tugallangan yoki bekor qilingan mashg\'ulotni o\'chirish mumkin emas.',
            ]);
        }

        $driving->delete();

        return redirect()->back();
    }
}
