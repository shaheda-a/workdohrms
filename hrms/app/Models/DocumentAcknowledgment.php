<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentAcknowledgment extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'document_id',
        'staff_member_id',
        'acknowledged_at',
        'ip_address',
        'notes',
    ];

    protected $casts = [
        'acknowledged_at' => 'datetime',
    ];

    public function document()
    {
        return $this->belongsTo(HrDocument::class, 'document_id');
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }
}
