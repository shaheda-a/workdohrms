<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaFile extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'name',
        'directory_id',
        'file_path',
        'file_type',
        'mime_type',
        'file_size',
        'uploaded_by',
        'is_shared',
        'shared_with',
    ];

    protected $casts = [
        'is_shared' => 'boolean',
        'shared_with' => 'array',
    ];

    public function directory()
    {
        return $this->belongsTo(MediaDirectory::class, 'directory_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFullPathAttribute()
    {
        if ($this->directory) {
            return $this->directory->full_path.'/'.$this->name;
        }

        return $this->name;
    }

    public function scopeShared($query)
    {
        return $query->where('is_shared', true);
    }
}
