<?php

namespace App\Models;

use App\Enums\DocumentOwnerType;
use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentType extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'title',
        'notes',
        'is_active',
        'tenant_id',
        'owner_type_id', // Changed to ID
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'owner_type_id' => 'integer',
    ];

    // Helper to get Enum from ID
    public function getOwnerTypeAttribute()
    {
        // Reverse mapping or logic to get Enum from ID if needed
        // For simple storage, we just keep the ID.
        // If you want the Enum object:
        foreach (DocumentOwnerType::cases() as $case) {
            if ($case->id() === $this->owner_type_id) {
                return $case;
            }
        }

        return null;
    }

    public function documents()
    {
        return $this->hasMany(OrganizationDocument::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
