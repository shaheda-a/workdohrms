<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'break_duration_minutes',
        'color',
        'is_night_shift',
        'overtime_after_hours',
    ];

    protected $casts = [
        'is_night_shift' => 'boolean',
        'overtime_after_hours' => 'decimal:2',
    ];

    public function assignments()
    {
        return $this->hasMany(ShiftAssignment::class);
    }
}
