<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContractType extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'title',
        'description',
        'default_duration_months',
    ];

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }
}
