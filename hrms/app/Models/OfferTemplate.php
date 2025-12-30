<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfferTemplate extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'name',
        'content',
        'variables',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function offers()
    {
        return $this->hasMany(Offer::class, 'template_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Available variables for templates
    public static function getAvailableVariables()
    {
        return [
            '{{candidate_name}}',
            '{{job_title}}',
            '{{salary}}',
            '{{start_date}}',
            '{{company_name}}',
            '{{department}}',
            '{{reporting_to}}',
            '{{benefits}}',
        ];
    }
}
