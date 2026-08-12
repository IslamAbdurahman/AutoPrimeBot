<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Autodrome extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'latitude',
        'longitude',
        'radius_meters',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function drivings(): HasMany
    {
        return $this->hasMany(Driving::class);
    }
}
