<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxExemption extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'exemption_amount',
        'notes',
        'is_active',
        'tenant_id',
    ];

    protected $casts = [
        'exemption_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
