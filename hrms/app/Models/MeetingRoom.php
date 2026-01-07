<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingRoom extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'name',
        'location',
        'capacity',
        'description',
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
