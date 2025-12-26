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
        $user->load('roles.permissions', 'staffMember');
        $role = $user->roles->first();
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $role ? $role->name : 'staff_member',
            'role_display' => $role ? ucwords(str_replace('_', ' ', $role->name)) : 'Staff Member',
            'permissions' => $permissions,
            'staff_member_id' => $user->staffMember?->id,
        ];
    }
}
