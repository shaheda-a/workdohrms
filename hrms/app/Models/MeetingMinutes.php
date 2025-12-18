<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingMinutes extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'content',
        'created_by',
    ];

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
