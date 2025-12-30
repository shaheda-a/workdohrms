<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftAssignment extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'shift_id',
        'staff_member_id',
        'effective_from',
        'effective_to',
        'is_rotating',
        'rotation_pattern',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
        'is_rotating' => 'boolean',
        'rotation_pattern' => 'array',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }
}
