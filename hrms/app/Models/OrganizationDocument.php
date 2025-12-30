<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganizationDocument extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'document_type_id',
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
        'notes',
        'tenant_id',
        'author_id',
    ];

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Get human readable file size.
     */
    public function getFileSizeFormattedAttribute(): string
    {
        $bytes = $this->file_size ?? 0;
        $units = ['B', 'KB', 'MB', 'GB'];
        $index = 0;

        while ($bytes >= 1024 && $index < count($units) - 1) {
            $bytes /= 1024;
            $index++;
        }

        return round($bytes, 2).' '.$units[$index];
    }
}
