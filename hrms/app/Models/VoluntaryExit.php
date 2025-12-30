<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VoluntaryExit extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'notice_date',
        'exit_date',
        'reason',
        'approval_status',
        'approved_by',
        'approval_remarks',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'notice_date' => 'date',
        'exit_date' => 'date',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function approvedByUser()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('approval_status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    public function scopeDeclined($query)
    {
        return $query->where('approval_status', 'declined');
    }
}
