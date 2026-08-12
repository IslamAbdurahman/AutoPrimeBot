<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function drivings()
    {
        return $this->hasMany(Driving::class);
    }
}
