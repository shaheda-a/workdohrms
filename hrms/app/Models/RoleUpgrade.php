<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoleUpgrade extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'staff_member_id',
        'new_job_title_id',
        'upgrade_title',
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

    public function newJobTitle()
    {
        return $this->belongsTo(JobTitle::class, 'new_job_title_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
