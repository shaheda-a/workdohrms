<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployerContribution extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_member_id',
        'title',
        'contribution_type',
        'amount',
        'effective_from',
        'effective_until',
        'is_active',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'effective_from' => 'date',
        'effective_until' => 'date',
        'is_active' => 'boolean',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function calculateAmount($baseSalary): float
    {
        if ($this->contribution_type === 'percentage') {
            return ($this->amount / 100) * $baseSalary;
        }
        return (float) $this->amount;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCurrentlyEffective($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('effective_from')
                ->orWhere('effective_from', '<=', now());
        })->where(function ($q) {
            $q->whereNull('effective_until')
                ->orWhere('effective_until', '>=', now());
        });
    }
}
