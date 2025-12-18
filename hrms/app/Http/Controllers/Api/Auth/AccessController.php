<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccessController extends Controller
{
    use ApiResponse;

    protected AuthService $service;

    public function __construct(AuthService $service)
    {
        $this->service = $service;
    }

    public function signUp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $result = $this->service->register($validated);

        return $this->created($result, 'Account created successfully');
    }

    public function signIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $result = $this->service->login($validated);

        return $this->success($result, 'Signed in successfully');
    }

    public function signOut(Request $request): JsonResponse
    {
        $this->service->logout($request->user());

        return $this->success(null, 'Signed out successfully');
    }

    public function profile(Request $request): JsonResponse
    {
        $result = $this->service->getProfile($request->user());

        return $this->success($result, 'Profile retrieved successfully');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $this->service->sendPasswordResetLink($validated['email']);

        return $this->success(null, 'Password reset link sent to your email');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $this->service->resetPassword($validated);

        return $this->success(null, 'Password has been reset successfully');
    }
}
