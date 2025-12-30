<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkLog extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'log_date',
        'status',
        'clock_in',
        'clock_out',
        'late_minutes',
        'early_leave_minutes',
        'overtime_minutes',
        'break_minutes',
        'notes',
        'clock_in_ip',
        'clock_out_ip',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'log_date' => 'date',
        'late_minutes' => 'integer',
        'early_leave_minutes' => 'integer',
        'overtime_minutes' => 'integer',
        'break_minutes' => 'integer',
    ];

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Calculate working hours.
     */
    public function getWorkingMinutesAttribute(): int
    {
        if (! $this->clock_in || ! $this->clock_out) {
            return 0;
        }

        $clockIn = Carbon::parse($this->clock_in);
        $clockOut = Carbon::parse($this->clock_out);

        return $clockOut->diffInMinutes($clockIn) - $this->break_minutes;
    }

    /**
     * Format working hours.
     */
    public function getWorkingHoursFormattedAttribute(): string
    {
        $minutes = $this->working_minutes;
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        return sprintf('%d:%02d', $hours, $mins);
    }

    // Scopes
    public function scopeForDate($query, $date)
    {
        return $query->where('log_date', $date);
    }

    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('log_date', [$startDate, $endDate]);
    }

    public function scopePresent($query)
    {
        return $query->whereIn('status', ['present', 'half_day']);
    }

    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }
}
