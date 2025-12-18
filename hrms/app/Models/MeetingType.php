<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingType extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'default_duration',
        'color',
    ];

    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }
}
