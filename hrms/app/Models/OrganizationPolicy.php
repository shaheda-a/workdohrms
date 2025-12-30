<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganizationPolicy extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'summary',
        'document_path',
        'version',
        'effective_date',
        'requires_acknowledgment',
        'is_active',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'requires_acknowledgment' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function acknowledgments()
    {
        return $this->belongsToMany(StaffMember::class, 'policy_acknowledgments')
            ->withPivot('acknowledged_at', 'ip_address')
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRequiringAcknowledgment($query)
    {
        return $query->where('requires_acknowledgment', true);
    }
}
