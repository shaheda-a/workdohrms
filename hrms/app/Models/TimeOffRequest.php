<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeOffRequest extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'time_off_category_id',
        'request_date',
        'start_date',
        'end_date',
        'total_days',
        'reason',
        'approval_status',
        'approved_by',
        'approval_remarks',
        'approved_at',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'request_date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'total_days' => 'decimal:1',
        'approved_at' => 'datetime',
    ];

    /**
     * Auto-calculate total_days when setting dates.
     */
    public static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->request_date)) {
                $model->request_date = now()->toDateString();
            }
            if (empty($model->total_days) && $model->start_date && $model->end_date) {
                $model->total_days = Carbon::parse($model->start_date)
                    ->diffInDays(Carbon::parse($model->end_date)) + 1;
            }
        });
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function category()
    {
        return $this->belongsTo(TimeOffCategory::class, 'time_off_category_id');
    }

    public function approvedByUser()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('approval_status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    public function scopeForPeriod($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
                ->orWhereBetween('end_date', [$startDate, $endDate]);
        });
    }
}
