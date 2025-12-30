<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LocationTransfer extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'new_office_location_id',
        'new_division_id',
        'effective_date',
        'notes',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'effective_date' => 'date',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function newOfficeLocation()
    {
        return $this->belongsTo(OfficeLocation::class, 'new_office_location_id');
    }

    public function newDivision()
    {
        return $this->belongsTo(Division::class, 'new_division_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
