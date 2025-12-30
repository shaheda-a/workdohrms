<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryAdvance extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'advance_type_id',
        'description',
        'principal_amount',
        'monthly_deduction',
        'remaining_balance',
        'issue_date',
        'start_deduction_date',
        'expected_completion_date',
        'notes',
        'status',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'monthly_deduction' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
        'issue_date' => 'date',
        'start_deduction_date' => 'date',
        'expected_completion_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->remaining_balance)) {
                $model->remaining_balance = $model->principal_amount;
            }
        });
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function advanceType()
    {
        return $this->belongsTo(AdvanceType::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Record a deduction payment.
     */
    public function recordDeduction($amount = null): void
    {
        $deductionAmount = $amount ?? $this->monthly_deduction;
        $this->remaining_balance = max(0, $this->remaining_balance - $deductionAmount);

        if ($this->remaining_balance <= 0) {
            $this->status = 'completed';
        }

        $this->save();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeReadyForDeduction($query)
    {
        return $query->active()
            ->where('start_deduction_date', '<=', now())
            ->where('remaining_balance', '>', 0);
    }
}
