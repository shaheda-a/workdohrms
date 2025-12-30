<?php

namespace App\Models;

use App\Enums\DocumentOwnerType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'document_type_id',
        'document_location_id',
        'org_id',
        'company_id',
        'user_id',
        'owner_type', // 'employee', 'company', 'accountant'
        'owner_id',   // The referenced ID
        'doc_url',
        'document_name',
        'document_size',
        'document_extension',
        'mime_type',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'owner_type' => DocumentOwnerType::class,
    ];

    // Relationships
    public function type()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id');
    }

    public function location()
    {
        return $this->belongsTo(DocumentLocation::class, 'document_location_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'org_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
