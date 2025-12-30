<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingProgram extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'training_type_id',
        'description',
        'duration',
        'cost',
        'trainer_name',
        'trainer_type',
        'status',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
    ];

    public function trainingType()
    {
        return $this->belongsTo(TrainingType::class);
    }

    public function sessions()
    {
        return $this->hasMany(TrainingSession::class);
    }
}
