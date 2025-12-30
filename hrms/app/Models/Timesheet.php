<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Timesheet extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'timesheet_project_id',
        'date',
        'start_time',
        'end_time',
        'hours',
        'task_description',
        'is_billable',
        'status',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'date' => 'date',
        'hours' => 'decimal:2',
        'is_billable' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function project()
    {
        return $this->belongsTo(TimesheetProject::class, 'timesheet_project_id');
    }

    public function approvedByUser()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'submitted');
    }
}
