<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingType extends Model
{
    use HasFactory, HasOrgAndCompany;

    // ADDED: meeting type status support
    protected $fillable = [
        'title',
        'description',
        'default_duration',
        'color',
        'status',
    ];

    public function meetings()
    {
        return $this->hasMany(Meeting::class);
    }
}
