<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeOnboarding extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'onboarding_template_id',
        'start_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function template()
    {
        return $this->belongsTo(OnboardingTemplate::class, 'onboarding_template_id');
    }

    public function taskCompletions()
    {
        return $this->hasMany(OnboardingTaskCompletion::class);
    }

    public function getProgressAttribute()
    {
        $totalTasks = $this->template->tasks()->count();
        $completedTasks = $this->taskCompletions()->count();

        return $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0;
    }
}
