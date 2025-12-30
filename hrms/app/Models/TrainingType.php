<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingType extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'description',
        'default_duration',
    ];

    public function programs()
    {
        return $this->hasMany(TrainingProgram::class);
    }
}
