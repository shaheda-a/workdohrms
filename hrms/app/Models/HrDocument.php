<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HrDocument extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'name',
        'category_id',
        'description',
        'file_path',
        'file_type',
        'file_size',
        'version',
        'uploaded_by',
        'requires_acknowledgment',
        'expiry_date',
        'is_active',
    ];

    protected $casts = [
        'requires_acknowledgment' => 'boolean',
        'is_active' => 'boolean',
        'expiry_date' => 'date',
    ];

    public function category()
    {
        return $this->belongsTo(DocumentCategory::class, 'category_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function acknowledgments()
    {
        return $this->hasMany(DocumentAcknowledgment::class, 'document_id');
    }

    public function acknowledgedBy()
    {
        return $this->belongsToMany(StaffMember::class, 'document_acknowledgments', 'document_id', 'staff_member_id')
            ->withPivot('acknowledged_at', 'ip_address')
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRequiringAcknowledgment($query)
    {
        return $query->where('requires_acknowledgment', true);
    }
}
