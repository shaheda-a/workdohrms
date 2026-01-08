<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetType extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'depreciation_rate',
    ];

    protected $casts = [
        'depreciation_rate' => 'decimal:2',
    ];

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}
