<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobRequisition extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'division_id',
        'job_title_id',
        'number_of_positions',
        'priority',
        'requested_by',
        'justification',
        'required_skills',
        'experience_required',
        'budget_from',
        'budget_to',
        'target_date',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'required_skills' => 'array',
        'target_date' => 'date',
        'approved_at' => 'datetime',
        'budget_from' => 'decimal:2',
        'budget_to' => 'decimal:2',
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function jobTitle()
    {
        return $this->belongsTo(JobTitle::class);
    }

    public function requester()
    {
        return $this->belongsTo(StaffMember::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function jobPostings()
    {
        return $this->hasMany(Job::class, 'requisition_id');
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
