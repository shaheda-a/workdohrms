<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingSession extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'training_program_id',
        'session_name',
        'date',
        'time',
        'location',
        'trainer_id',
        'max_participants',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime:H:i',
    ];

    public function program()
    {
        return $this->belongsTo(TrainingProgram::class, 'training_program_id');
    }

    public function trainer()
    {
        return $this->belongsTo(StaffMember::class, 'trainer_id');
    }

    public function participants()
    {
        return $this->hasMany(TrainingParticipant::class);
    }
}
