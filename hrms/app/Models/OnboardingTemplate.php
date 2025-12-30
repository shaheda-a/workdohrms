<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnboardingTemplate extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'description',
        'days_to_complete',
    ];

    public function tasks()
    {
        return $this->hasMany(OnboardingTask::class)->orderBy('order');
    }

    public function employeeOnboardings()
    {
        return $this->hasMany(EmployeeOnboarding::class);
    }
}
