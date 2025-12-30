<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WithholdingType extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'notes',
        'is_statutory',
        'is_active',
        'tenant_id',
    ];

    protected $casts = [
        'is_statutory' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function recurringDeductions()
    {
        return $this->hasMany(RecurringDeduction::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeStatutory($query)
    {
        return $query->where('is_statutory', true);
    }
}
