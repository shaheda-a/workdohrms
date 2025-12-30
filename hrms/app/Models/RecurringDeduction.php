<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RecurringDeduction extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'staff_member_id',
        'withholding_type_id',
        'description',
        'calculation_type',
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

    public function withholdingType()
    {
        return $this->belongsTo(WithholdingType::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Calculate the actual amount based on base salary.
     */
    public function calculateAmount($baseSalary): float
    {
        if ($this->calculation_type === 'percentage') {
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
