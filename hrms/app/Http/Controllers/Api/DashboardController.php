<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Dashboard Controller
 * 
 * Provides aggregated data for dashboard displays.
 */
class DashboardController extends Controller
{
    use ApiResponse;

    protected DashboardService $service;

    public function __construct(DashboardService $service)
    {
        $this->service = $service;
    }

    /**
     * Get complete dashboard data.
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->service->getDashboardData();

            return $this->success($data, 'Dashboard data retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve dashboard data: ' . $e->getMessage());
        }
    }

    /**
     * Get employee statistics.
     */
    public function employeeStats(): JsonResponse
    {
        try {
            $data = $this->service->getEmployeeStats();

            return $this->success($data, 'Employee statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve employee statistics: ' . $e->getMessage());
        }
    }

    /**
     * Get attendance summary.
     */
    public function attendanceSummary(): JsonResponse
    {
        try {
            $data = $this->service->getDashboardData()['attendance'] ?? [];

            return $this->success($data, 'Attendance summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve attendance summary: ' . $e->getMessage());
        }
    }

    /**
     * Get employee growth trend.
     */
    public function employeeGrowth(): JsonResponse
    {
        try {
            $data = $this->service->getEmployeeGrowthTrend();

            return $this->success($data, 'Employee growth trend retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve employee growth trend: ' . $e->getMessage());
        }
    }

    /**
     * Get department distribution.
     */
    public function departmentDistribution(): JsonResponse
    {
        try {
            $data = $this->service->getDepartmentDistribution();

            return $this->success($data, 'Department distribution retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve department distribution: ' . $e->getMessage());
        }
    }
}
