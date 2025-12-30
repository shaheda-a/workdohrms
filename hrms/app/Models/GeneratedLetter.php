<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeneratedLetter extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'staff_member_id',
        'letter_template_id',
        'reference_number',
        'rendered_content',
        'pdf_path',
        'issue_date',
        'tenant_id',
        'author_id',
    ];

    protected $casts = [
        'issue_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->reference_number)) {
                $model->reference_number = static::generateReference();
            }
        });
    }

    public static function generateReference(): string
    {
        $prefix = 'LTR';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(uniqid(), -4));

        return "{$prefix}-{$date}-{$random}";
    }

    public function staffMember()
    {
        return $this->belongsTo(StaffMember::class);
    }

    public function template()
    {
        return $this->belongsTo(LetterTemplate::class, 'letter_template_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
