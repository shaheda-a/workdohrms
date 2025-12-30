<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LetterTemplate extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'template_type',
        'language',
        'content',
        'placeholders',
        'is_default',
        'is_active',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'placeholders' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Default available placeholders.
     */
    public static function getDefaultPlaceholders(): array
    {
        return [
            '{staff_name}' => 'Full name of staff member',
            '{staff_code}' => 'Staff ID/Code',
            '{email}' => 'Staff email address',
            '{job_title}' => 'Job title/designation',
            '{division}' => 'Division/department name',
            '{office_location}' => 'Office/branch name',
            '{hire_date}' => 'Date of joining',
            '{exit_date}' => 'Last working day',
            '{issue_date}' => 'Letter issue date',
            '{company_name}' => 'Company name',
            '{company_address}' => 'Company address',
            '{reference_number}' => 'Letter reference number',
        ];
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function generatedLetters()
    {
        return $this->hasMany(GeneratedLetter::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('template_type', $type);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }
}
