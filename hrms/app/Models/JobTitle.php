<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobTitle extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'title',
        'division_id',
        'notes',
        'is_active',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the division this job title belongs to.
     */
    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Get the author who created this job title.
     */
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Get the office location through division.
     */
    public function officeLocation()
    {
        return $this->hasOneThrough(
            OfficeLocation::class,
            Division::class,
            'id',
            'id',
            'division_id',
            'office_location_id'
        );
    }

    /**
     * Scope to filter active job titles.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by division.
     */
    public function scopeForDivision($query, $divisionId)
    {
        return $query->where('division_id', $divisionId);
    }
}
