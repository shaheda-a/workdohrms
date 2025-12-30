<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentAwsConfig extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'location_id', 'bucket', 'region', 'access_key', 'secret_key', 'endpoint', 'is_active',
    ];

    // Temporarily disabled encryption - re-enable after re-seeding config
    // protected $casts = [
    //     'access_key' => 'encrypted',
    //     'secret_key' => 'encrypted',
    // ];

    public function location()
    {
        return $this->belongsTo(DocumentLocation::class, 'location_id');
    }
}
