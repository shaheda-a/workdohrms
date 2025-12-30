<?php

namespace App\Services\Auth;

use App\Exceptions\AccountDeactivatedException;
use App\Exceptions\InvalidCredentialsException;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_active' => true,
        ]);

        $user->assignRole('staff_member');

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $this->formatUserData($user),
            'token' => $token,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw new InvalidCredentialsException;
        }

        if (! $user->is_active) {
            throw new AccountDeactivatedException;
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $this->formatUserData($user),
            'token' => $token,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Revoke current access token.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    /**
     * Get user profile with roles and permissions.
     */
    public function getProfile(User $user): array
    {
        return [
            'user' => $user->load('roles', 'permissions'),
        ];
    }

    /**
     * Send password reset link.
     */
    public function sendPasswordResetLink(string $email): string
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return $status;
    }

    /**
     * Reset password with token.
     */
    public function resetPassword(array $data): string
    {
        $status = Password::reset(
            $data,
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return $status;
    }

    /**
     * Format user data for response.
     */
    protected function formatUserData(User $user): array
    {
        $user->load(['roles' => function ($query) {
            $query->orderBy('hierarchy_level');
        }, 'roles.permissions', 'staffMember', 'organization', 'company']);

        $roles = $user->roles;
        $primaryRole = $roles->sortBy('hierarchy_level')->first();
        $permissions = $user->getAllPermissions()->pluck('name')->unique()->values()->toArray();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $primaryRole ? $primaryRole->name : 'staff',
            'role_display' => $primaryRole ? ucwords(str_replace('_', ' ', $primaryRole->name)) : 'Staff',
            'roles' => $roles->pluck('name')->toArray(),
            'permissions' => $permissions,
            'primary_role' => $primaryRole ? $primaryRole->name : 'staff',
            'primary_role_icon' => $primaryRole ? $primaryRole->icon : 'User',
            'primary_role_hierarchy' => $primaryRole ? $primaryRole->hierarchy_level : 5,
            'staff_member_id' => $user->staffMember?->id,
            'org_id' => $user->org_id,
            'company_id' => $user->company_id,
            'organization_name' => $user->organization?->name,
            'company_name' => $user->company?->company_name,
        ];
    }
}
