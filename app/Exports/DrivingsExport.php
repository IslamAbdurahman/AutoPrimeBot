<?php

namespace App\Exports;

use App\Models\Driving;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DrivingsExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles
{
    private int $rowNumber = 0;

    public function __construct(public array $filters = []) {}

    public function query()
    {
        $query = Driving::query()->with(['student', 'group', 'instructor', 'autodrome', 'review']);

        if (! empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (! empty($this->filters['status']) && $this->filters['status'] !== 'all') {
            $query->where('status', $this->filters['status']);
        }

        if (! empty($this->filters['from'])) {
            $query->whereDate('start_time', '>=', $this->filters['from']);
        }

        if (! empty($this->filters['to'])) {
            $query->whereDate('start_time', '<=', $this->filters['to']);
        }

        if (! empty($this->filters['instructor_id'])) {
            $query->where('instructor_id', $this->filters['instructor_id']);
        }

        return $query->latest('start_time');
    }

    public function headings(): array
    {
        return [
            '№',
            "O'quvchi F.I.Sh",
            'Guruh',
            'Instruktor',
            'Avtodrom',
            'Boshlanish vaqti',
            'Tugash vaqti',
            'Holati',
            'Baho',
            'Sabablar (Teglar)',
            'Matnli izoh',
        ];
    }

    public function map($driving): array
    {
        $this->rowNumber++;

        $statusText = match ($driving->status) {
            'completed' => 'Yakunlangan',
            'scheduled' => 'Rejalashtirilgan',
            'cancelled' => 'Bekor qilingan',
            default => $driving->status,
        };

        $rating = $driving->review ? "{$driving->review->rating} ⭐" : 'Baholanmagan';
        $tags = $driving->review && ! empty($driving->review->reason_tags) ? implode(', ', $driving->review->reason_tags) : '';
        $comment = $driving->review->comment ?? '';

        return [
            $this->rowNumber,
            $driving->student?->full_name ?? "Noma'lum",
            $driving->group?->name ?? 'Guruhsiz',
            $driving->instructor?->name ?? 'Biriktirilmagan',
            $driving->autodrome?->name ?? 'Kiritilmagan',
            $driving->start_time ? $driving->start_time->format('d.m.Y H:i') : '',
            $driving->end_time ? $driving->end_time->format('H:i') : '',
            $statusText,
            $rating,
            $tags,
            $comment,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
