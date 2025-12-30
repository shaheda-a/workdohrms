<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalarySlip extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'slip_reference',
        'salary_period',
        'basic_salary',
        'benefits_breakdown',
        'incentives_breakdown',
        'bonus_breakdown',
        'overtime_breakdown',
        'contributions_breakdown',
        'deductions_breakdown',
        'advances_breakdown',
        'tax_breakdown',
        'total_earnings',
        'total_deductions',
        'net_payable',
        'status',
        'generated_at',
        'sent_at',
        'paid_at',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'benefits_breakdown' => 'array',
        'incentives_breakdown' => 'array',
        'bonus_breakdown' => 'array',
        'overtime_breakdown' => 'array',
        'contributions_breakdown' => 'array',
        'deductions_breakdown' => 'array',
        'advances_breakdown' => 'array',
        'tax_breakdown' => 'array',
        'total_earnings' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_payable' => 'decimal:2',
        'generated_at' => 'datetime',
        'sent_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->slip_reference)) {
                $model->slip_reference = static::generateReference();
            }
        });
    }

    public static function generateReference(): string
    {
        $prefix = 'SLP';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -4));

        return "{$prefix}-{$date}-{$random}";
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // Scopes
    public function scopeForPeriod($query, $period)
    {
        return $query->where('salary_period', $period);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeGenerated($query)
    {
        return $query->where('status', 'generated');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }
}
