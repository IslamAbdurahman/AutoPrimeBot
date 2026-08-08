<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Autodrome;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AutodromeController extends Controller
{
    public function index(Request $request): Response
    {
        $autodromes = Autodrome::withCount(['drivings as completed_drivings_count' => function ($q) {
            $q->where('status', 'completed');
        }])->orderBy('name')->get();

        return Inertia::render('Admin/Autodromes/Index', [
            'autodromes' => $autodromes,
        ]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'radius_meters' => 'required|integer|min:10',
        ]);

        Autodrome::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Autodrome $autodrome)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'radius_meters' => 'required|integer|min:10',
        ]);

        $autodrome->update($validated);

        return redirect()->back();
    }

    public function destroy(Autodrome $autodrome, Request $request)
    {
        if ($request->user()->role === 'instructor') {
            abort(403, 'Instruktorlar faqat mashg\'ulotlar (drivings) bo\'limida amaliyot bajara oladi.');
        }

        $autodrome->delete();

        return redirect()->back();
    }
}
