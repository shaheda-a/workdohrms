<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingParticipant extends Model
{
    use HasFactory, HasOrgAndCompany;

    // ADDED: training_program_id support
    protected $fillable = [
        'training_session_id',
        'staff_member_id',
        'training_program_id',
        'status',
        'attendance_status',
        'score',
        'feedback',
        'certificate_issued',
        'certificate_issued_at',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'certificate_issued' => 'boolean',
        'certificate_issued_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(TrainingSession::class, 'training_session_id');
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    // ADDED: training_program_id support
    public function trainingProgram()
    {
        return $this->belongsTo(TrainingProgram::class);
    }
}
