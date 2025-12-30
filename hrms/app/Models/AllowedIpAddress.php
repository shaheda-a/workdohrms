<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AllowedIpAddress extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'ip_address',
        'label',
        'notes',
        'is_active',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if an IP is allowed.
     */
    public static function isAllowed(string $ip): bool
    {
        return static::active()
            ->where('ip_address', $ip)
            ->exists();
    }
}
