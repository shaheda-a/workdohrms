<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MinimumTaxLimit extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'threshold_amount',
        'notes',
        'is_active',
        'tenant_id',
    ];

    protected $casts = [
        'threshold_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
