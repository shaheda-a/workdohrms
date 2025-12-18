<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingActionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id',
        'title',
        'assigned_to',
        'due_date',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    public function assignedEmployee()
    {
        return $this->belongsTo(StaffMember::class, 'assigned_to');
    }
}
