<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxSlab extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'income_from',
        'income_to',
        'fixed_amount',
        'percentage',
        'is_active',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'income_from' => 'decimal:2',
        'income_to' => 'decimal:2',
        'fixed_amount' => 'decimal:2',
        'percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Calculate tax for a given income amount.
     */
    public function calculateTax($income): float
    {
        if ($income < $this->income_from || $income > $this->income_to) {
            return 0;
        }

        $taxableInSlab = min($income - $this->income_from, $this->income_to - $this->income_from);

        return $this->fixed_amount + ($taxableInSlab * ($this->percentage / 100));
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForIncome($query, $income)
    {
        return $query->where('income_from', '<=', $income)
            ->where('income_to', '>=', $income);
    }
}
