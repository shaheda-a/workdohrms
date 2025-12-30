<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppraisalCycle extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'cycle_start',
        'cycle_end',
        'review_deadline',
        'status',
        'notes',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'cycle_start' => 'date',
        'cycle_end' => 'date',
        'review_deadline' => 'date',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function records()
    {
        return $this->hasMany(AppraisalRecord::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCurrent($query)
    {
        return $query->active()
            ->where('cycle_start', '<=', now())
            ->where('cycle_end', '>=', now());
    }
}
