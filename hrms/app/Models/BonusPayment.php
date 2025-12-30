<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BonusPayment extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'title',
        'payment_type',
        'amount',
        'payment_date',
        'notes',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function calculateAmount($baseSalary): float
    {
        if ($this->payment_type === 'percentage') {
            return ($this->amount / 100) * $baseSalary;
        }

        return (float) $this->amount;
    }
}
