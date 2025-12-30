<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PerformanceObjective extends Model
{
    use HasFactory, HasOrgAndCompany, SoftDeletes;

    protected $fillable = [
        'staff_member_id',
        'title',
        'description',
        'objective_type',
        'measurement_unit',
        'target_value',
        'current_value',
        'weight_percentage',
        'start_date',
        'due_date',
        'status',
        'rating',
        'manager_notes',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'target_value' => 'decimal:2',
        'current_value' => 'decimal:2',
        'weight_percentage' => 'integer',
        'start_date' => 'date',
        'due_date' => 'date',
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
     * Calculate completion percentage.
     */
    public function getCompletionPercentageAttribute(): float
    {
        if (! $this->target_value || $this->target_value == 0) {
            return $this->status === 'completed' ? 100 : 0;
        }

        return min(100, round(($this->current_value / $this->target_value) * 100, 2));
    }

    /**
     * Check if overdue.
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->status !== 'completed' && $this->due_date < now();
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['not_started', 'in_progress']);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('objective_type', $type);
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', '!=', 'completed')
            ->where('due_date', '<', now());
    }
}
