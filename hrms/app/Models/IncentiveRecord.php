<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IncentiveRecord extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'staff_member_id',
        'description',
        'calculation_type',
        'amount',
        'period_start',
        'period_end',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'period_start' => 'date',
        'period_end' => 'date',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
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

    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('period_start', [$startDate, $endDate])
                ->orWhereBetween('period_end', [$startDate, $endDate]);
        });
    }
}
