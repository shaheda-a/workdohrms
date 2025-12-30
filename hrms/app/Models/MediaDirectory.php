<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaDirectory extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'name',
        'parent_id',
        'created_by',
        'path',
    ];

    public function parent()
    {
        return $this->belongsTo(MediaDirectory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(MediaDirectory::class, 'parent_id');
    }

    public function files()
    {
        return $this->hasMany(MediaFile::class, 'directory_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFullPathAttribute()
    {
        if ($this->parent) {
            return $this->parent->full_path.'/'.$this->name;
        }

        return $this->name;
    }
}
