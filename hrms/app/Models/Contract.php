<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'contract_type_id',
        'reference_number',
        'start_date',
        'end_date',
        'salary',
        'terms',
        'document_path',
        'status',
        'renewal_reminder_days',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'salary' => 'decimal:2',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function contractType()
    {
        return $this->belongsTo(ContractType::class);
    }

    public function renewals()
    {
        return $this->hasMany(ContractRenewal::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->where('status', 'active')
            ->whereDate('end_date', '<=', now()->addDays($days));
    }
}
