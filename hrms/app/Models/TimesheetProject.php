<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimesheetProject extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'name',
        'client_name',
        'description',
        'is_billable',
        'hourly_rate',
        'status',
    ];

    protected $casts = [
        'is_billable' => 'boolean',
        'hourly_rate' => 'decimal:2',
    ];

    public function timesheets()
    {
        return $this->hasMany(Timesheet::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
