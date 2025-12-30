<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApplicationNote extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'job_application_id',
        'user_id',
        'note',
    ];

    public function application()
    {
        return $this->belongsTo(JobApplication::class, 'job_application_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
