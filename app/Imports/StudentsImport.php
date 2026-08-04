<?php

namespace App\Imports;

use App\Models\Student;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StudentsImport implements ToCollection, WithHeadingRow
{
    protected $groupId;

    public $importedCount = 0;

    public function __construct($groupId)
    {
        $this->groupId = $groupId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Maatwebsite/Excel uses snake_case keys for headers by default
            $fullName = $row['full_name'] ?? $row['ism'] ?? $row['f_i_sh'] ?? $row['name'] ?? null;
            $phone = $row['phone'] ?? $row['telefon'] ?? $row['tel'] ?? null;
            $gender = $row['gender'] ?? $row['jins'] ?? null;

            if (! $fullName) {
                continue;
            }

            if ($phone) {
                $phone = preg_replace('/[^\d+]/', '', $phone);
                if (! str_starts_with($phone, '+') && strlen($phone) >= 9) {
                    $phone = '+'.ltrim($phone, ' +');
                }
            }

            $student = null;
            if ($phone) {
                $student = Student::where('phone', $phone)->first();
            }

            if ($student) {
                $student->group_id = $this->groupId;
                $student->full_name = $fullName;
                $student->save();
            } else {
                Student::create([
                    'full_name' => $fullName,
                    'phone' => $phone,
                    'gender' => in_array(strtolower((string) $gender), ['ayol', 'female', 'f']) ? 'female' : 'male',
                    'group_id' => $this->groupId,
                ]);
            }
            $this->importedCount++;
        }
    }
}
