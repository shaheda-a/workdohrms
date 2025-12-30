<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'candidate_id',
        'job_posting_id',
        'template_id',
        'job_title',
        'salary',
        'start_date',
        'expiry_date',
        'benefits',
        'terms_conditions',
        'content',
        'document_path',
        'status',
        'sent_at',
        'responded_at',
        'response_notes',
        'created_by',
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'start_date' => 'date',
        'expiry_date' => 'date',
        'benefits' => 'array',
        'sent_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function jobPosting()
    {
        return $this->belongsTo(Job::class, 'job_posting_id');
    }

    public function template()
    {
        return $this->belongsTo(OfferTemplate::class, 'template_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'sent')->where('expiry_date', '>=', now());
    }

    public function scopeAccepted($query)
    {
        return $query->where('status', 'accepted');
    }

    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now())->whereNotIn('status', ['accepted', 'rejected']);
    }
}
