<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobStage extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'order',
        'color',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function applications()
    {
        return $this->hasMany(JobApplication::class);
    }
}
