<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CompanyHoliday extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'title',
        'holiday_date',
        'notes',
        'is_recurring',
        'tenant_id',
    ];

    protected $casts = [
        'holiday_date' => 'date',
        'is_recurring' => 'boolean',
    ];

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('holiday_date', '>=', now())
            ->orderBy('holiday_date');
    }

    public function scopeForYear($query, $year)
    {
        return $query->whereYear('holiday_date', $year);
    }

    public function scopeForMonth($query, $month)
    {
        return $query->whereMonth('holiday_date', $month);
    }
}
