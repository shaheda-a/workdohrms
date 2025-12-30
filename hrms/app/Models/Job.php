<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $table = 'job_postings';

    protected $fillable = [
        'title',
        'job_category_id',
        'office_location_id',
        'division_id',
        'positions',
        'description',
        'requirements',
        'skills',
        'experience_required',
        'salary_from',
        'salary_to',
        'status',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'salary_from' => 'decimal:2',
        'salary_to' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(JobCategory::class, 'job_category_id');
    }

    public function officeLocation()
    {
        return $this->belongsTo(OfficeLocation::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function applications()
    {
        return $this->hasMany(JobApplication::class, 'job_posting_id');
    }

    public function customQuestions()
    {
        return $this->hasMany(CustomQuestion::class, 'job_posting_id');
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }
}
