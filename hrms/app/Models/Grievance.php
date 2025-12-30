<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grievance extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'filed_by_staff_id',
        'against_staff_id',
        'against_division_id',
        'subject',
        'incident_date',
        'description',
        'status',
        'resolution',
        'resolved_date',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'resolved_date' => 'date',
    ];

    public function filedByStaff()
    {
        return $this->belongsTo(StaffMember::class, 'filed_by_staff_id');
    }

    public function againstStaff()
    {
        return $this->belongsTo(StaffMember::class, 'against_staff_id');
    }

    public function againstDivision()
    {
        return $this->belongsTo(Division::class, 'against_division_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // Scopes
    public function scopeFiled($query)
    {
        return $query->where('status', 'filed');
    }

    public function scopeInvestigating($query)
    {
        return $query->where('status', 'investigating');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }
}
