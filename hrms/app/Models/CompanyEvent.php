<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyEvent extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'event_start',
        'event_end',
        'start_time',
        'end_time',
        'location',
        'color',
        'description',
        'is_all_day',
        'is_company_wide',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'event_start' => 'date',
        'event_end' => 'date',
        'is_all_day' => 'boolean',
        'is_company_wide' => 'boolean',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function attendees()
    {
        return $this->belongsToMany(StaffMember::class, 'company_event_attendees')
            ->withPivot('response', 'responded_at')
            ->withTimestamps();
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('event_start', '>=', now()->toDateString())
            ->orderBy('event_start');
    }

    public function scopeForDateRange($query, $start, $end)
    {
        return $query->where(function ($q) use ($start, $end) {
            $q->whereBetween('event_start', [$start, $end])
                ->orWhereBetween('event_end', [$start, $end])
                ->orWhere(function ($q2) use ($start, $end) {
                    $q2->where('event_start', '<=', $start)
                        ->where('event_end', '>=', $end);
                });
        });
    }

    public function scopeCompanyWide($query)
    {
        return $query->where('is_company_wide', true);
    }
}
