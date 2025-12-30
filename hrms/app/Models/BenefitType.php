<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BenefitType extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'notes',
        'is_taxable',
        'is_active',
        'tenant_id',
    ];

    protected $casts = [
        'is_taxable' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function staffBenefits()
    {
        return $this->hasMany(StaffBenefit::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
