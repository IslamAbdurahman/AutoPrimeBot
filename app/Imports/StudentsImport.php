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

            if (! $fullName) {
                continue;
            }

            if ($phone) {
                $digits = preg_replace('/\D/', '', (string) $phone);
                if (strlen($digits) === 9) {
                    $digits = '998'.$digits;
                }
                if ($digits !== '') {
                    $phone = '+'.$digits;
                } else {
                    $phone = null;
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
                    'group_id' => $this->groupId,
                ]);
            }
            $this->importedCount++;
        }
    }
}
