<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'name',
        'asset_type_id',
        'serial_number',
        'asset_code',
        'purchase_date',
        'purchase_cost',
        'current_value',
        'status',
        'condition',
        'description',
        'location',
        'supplier',
        'warranty_info',
        'warranty_expiry',
        'qr_code',
        'assigned_to',
        'assigned_date',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
        'assigned_date' => 'date',
        'purchase_cost' => 'decimal:2',
        'current_value' => 'decimal:2',
    ];

    public function assetType()
    {
        return $this->belongsTo(AssetType::class);
    }

    public function assignedEmployee()
    {
        return $this->belongsTo(StaffMember::class, 'assigned_to');
    }

    public function assignments()
    {
        return $this->hasMany(AssetAssignment::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeAssigned($query)
    {
        return $query->where('status', 'assigned');
    }
}
