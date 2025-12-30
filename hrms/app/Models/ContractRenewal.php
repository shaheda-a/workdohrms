<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContractRenewal extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'contract_id',
        'old_end_date',
        'new_end_date',
        'new_salary',
        'notes',
        'renewed_by',
        'renewed_at',
    ];

    protected $casts = [
        'old_end_date' => 'date',
        'new_end_date' => 'date',
        'new_salary' => 'decimal:2',
        'renewed_at' => 'datetime',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function renewedByUser()
    {
        return $this->belongsTo(User::class, 'renewed_by');
    }
}
