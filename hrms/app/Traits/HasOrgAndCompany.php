<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

trait HasOrgAndCompany
{
    /**
     * Boot the trait to automatically set org_id and company_id on creating.
     */
    public static function bootHasOrgAndCompany(): void
    {
        static::creating(function ($model) {
            $user = Auth::user();

            if ($user) {
                if (empty($model->org_id) && ! is_null($user->org_id)) {
                    $model->org_id = $user->org_id;
                }

                if (empty($model->company_id) && ! is_null($user->company_id)) {
                    $model->company_id = $user->company_id;
                }
            }
        });
    }

    /**
     * Get the organization that owns this model.
     */
    public function organization()
    {
        return $this->belongsTo(\App\Models\Organization::class, 'org_id');
    }

    /**
     * Get the company that owns this model.
     */
    public function company()
    {
        return $this->belongsTo(\App\Models\Company::class, 'company_id');
    }

    /**
     * Scope a query to only include records for a specific organization.
     */
    public function scopeForOrganization($query, $orgId)
    {
        return $query->where('org_id', $orgId);
    }

    /**
     * Scope a query to only include records for a specific company.
     */
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope a query to only include records for the authenticated user's organization.
     */
    public function scopeForCurrentOrganization($query)
    {
        $user = Auth::user();

        if ($user && $user->org_id) {
            return $query->where('org_id', $user->org_id);
        }

        return $query;
    }

    /**
     * Scope a query to only include records for the authenticated user's company.
     */
    public function scopeForCurrentCompany($query)
    {
        $user = Auth::user();

        if ($user && $user->company_id) {
            return $query->where('company_id', $user->company_id);
        }

        return $query;
    }
}
