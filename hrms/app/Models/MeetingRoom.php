<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'capacity',
        'equipment',
        'status',
    ];

    protected $casts = [
        'equipment' => 'array',
    ];

    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }
}
