<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyNotice extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'content',
        'publish_date',
        'expire_date',
        'is_company_wide',
        'is_featured',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'publish_date' => 'date',
        'expire_date' => 'date',
        'is_company_wide' => 'boolean',
        'is_featured' => 'boolean',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function recipients()
    {
        return $this->belongsToMany(StaffMember::class, 'company_notice_recipients')
            ->withPivot('is_read', 'read_at')
            ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('publish_date', '<=', now())
            ->where(function ($q) {
                $q->whereNull('expire_date')
                    ->orWhere('expire_date', '>=', now());
            });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeCompanyWide($query)
    {
        return $query->where('is_company_wide', true);
    }
}
