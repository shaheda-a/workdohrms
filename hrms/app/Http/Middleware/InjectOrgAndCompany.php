<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InjectOrgAndCompany
{
    /**
     * Handle an incoming request.
     *
     * Injects org_id and company_id from the authenticated user into the request.
     * This ensures all write operations have the correct org/company context.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            if (! $request->has('org_id') && $user->org_id) {
                $request->merge(['org_id' => $user->org_id]);
            }

            if (! $request->has('company_id') && $user->company_id) {
                $request->merge(['company_id' => $user->company_id]);
            }
        }

        return $next($request);
    }
}
