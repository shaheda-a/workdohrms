<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceRegularization extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'work_log_id',
        'date',
        'original_clock_in',
        'original_clock_out',
        'requested_clock_in',
        'requested_clock_out',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected $casts = [
        'date' => 'date',
        'original_clock_in' => 'datetime',
        'original_clock_out' => 'datetime',
        'requested_clock_in' => 'datetime',
        'requested_clock_out' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function workLog()
    {
        return $this->belongsTo(WorkLog::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
