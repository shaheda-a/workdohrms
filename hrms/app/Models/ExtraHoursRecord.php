<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExtraHoursRecord extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'staff_member_id',
        'title',
        'days_count',
        'hours_per_day',
        'hourly_rate',
        'period_start',
        'period_end',
        'notes',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'days_count' => 'integer',
        'hours_per_day' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
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
     * Calculate total overtime amount.
     */
    public function getTotalAmountAttribute(): float
    {
        return $this->days_count * $this->hours_per_day * $this->hourly_rate;
    }
}
