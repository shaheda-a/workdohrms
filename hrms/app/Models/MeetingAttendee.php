<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MeetingAttendee extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'meeting_id',
        'staff_member_id',
        'status',
        'is_organizer',
    ];

    protected $casts = [
        'is_organizer' => 'boolean',
    ];

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }
}
