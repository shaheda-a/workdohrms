<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'meeting_type_id',
        'meeting_room_id',
        'date',
        'start_time',
        'end_time',
        'description',
        'created_by',
        'status',
        'meeting_link',
        'is_recurring',
        'recurrence_pattern',
    ];

    protected $casts = [
        'date' => 'date',
        'is_recurring' => 'boolean',
        'recurrence_pattern' => 'array',
    ];

    public function meetingType()
    {
        return $this->belongsTo(MeetingType::class);
    }

    public function meetingRoom()
    {
        return $this->belongsTo(MeetingRoom::class);
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attendees()
    {
        return $this->hasMany(MeetingAttendee::class);
    }

    public function minutes()
    {
        return $this->hasMany(MeetingMinutes::class);
    }

    public function actionItems()
    {
        return $this->hasMany(MeetingActionItem::class);
    }
}
