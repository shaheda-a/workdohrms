<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'job_posting_id',
        'candidate_id',
        'job_stage_id',
        'applied_date',
        'rating',
        'notes',
        'custom_answers',
        'status',
    ];

    protected $casts = [
        'applied_date' => 'date',
        'custom_answers' => 'array',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class, 'job_posting_id');
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function stage()
    {
        return $this->belongsTo(JobStage::class, 'job_stage_id');
    }

    public function interviews()
    {
        return $this->hasMany(InterviewSchedule::class);
    }

    public function applicationNotes()
    {
        return $this->hasMany(ApplicationNote::class);
    }
}
