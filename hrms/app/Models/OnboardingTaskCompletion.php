<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnboardingTaskCompletion extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'employee_onboarding_id',
        'onboarding_task_id',
        'completed_at',
        'completed_by',
        'notes',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function employeeOnboarding()
    {
        return $this->belongsTo(EmployeeOnboarding::class);
    }

    public function task()
    {
        return $this->belongsTo(OnboardingTask::class, 'onboarding_task_id');
    }

    public function completedByUser()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
