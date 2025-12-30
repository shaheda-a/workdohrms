<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentLocalConfig extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = ['location_id', 'root_path', 'is_active'];

    public function location()
    {
        return $this->belongsTo(DocumentLocation::class, 'location_id');
    }
}
