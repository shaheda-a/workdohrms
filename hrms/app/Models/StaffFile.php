<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffFile extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'file_category_id',
        'file_path',
        'original_name',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function fileCategory()
    {
        return $this->belongsTo(FileCategory::class);
    }
}
