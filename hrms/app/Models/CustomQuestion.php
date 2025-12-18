<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_posting_id',
        'question',
        'is_required',
        'order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class, 'job_posting_id');
    }
}
