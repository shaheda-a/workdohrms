<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_type', // 1 = local, 2 = wasabi, 3 = aws
        'org_id',
        'company_id',
    ];

    public function localConfig()
    {
        return $this->hasOne(DocumentLocalConfig::class, 'location_id');
    }

    public function wasabiConfig()
    {
        return $this->hasOne(DocumentWasabiConfig::class, 'location_id');
    }

    public function awsConfig()
    {
        return $this->hasOne(DocumentAwsConfig::class, 'location_id');
    }
}
