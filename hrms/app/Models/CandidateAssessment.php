<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CandidateAssessment extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'candidate_id',
        'job_application_id',
        'assessment_type',
        'title',
        'score',
        'max_score',
        'percentage',
        'assessment_date',
        'assessed_by',
        'notes',
        'attachment_path',
        'status',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'max_score' => 'decimal:2',
        'percentage' => 'decimal:2',
        'assessment_date' => 'date',
    ];

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function jobApplication()
    {
        return $this->belongsTo(JobApplication::class);
    }

    public function assessor()
    {
        return $this->belongsTo(StaffMember::class, 'assessed_by');
    }

    // Calculate percentage automatically
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            if ($model->score && $model->max_score && $model->max_score > 0) {
                $model->percentage = ($model->score / $model->max_score) * 100;
            }
        });
    }
}
