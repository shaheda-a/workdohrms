<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppraisalRecord extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'appraisal_cycle_id',
        'staff_member_id',
        'reviewer_id',
        'status',
        'self_assessment',
        'manager_feedback',
        'overall_rating',
        'strengths',
        'improvements',
        'career_goals',
        'self_submitted_at',
        'manager_submitted_at',
        'tenant_id',
    ];

    protected $casts = [
        'overall_rating' => 'decimal:2',
        'self_submitted_at' => 'datetime',
        'manager_submitted_at' => 'datetime',
    ];

    public function cycle()
    {
        return $this->belongsTo(AppraisalCycle::class, 'appraisal_cycle_id');
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeForCycle($query, $cycleId)
    {
        return $query->where('appraisal_cycle_id', $cycleId);
    }
}
