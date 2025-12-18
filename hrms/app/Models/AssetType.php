<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetType extends Model
{
    use HasFactory;

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
