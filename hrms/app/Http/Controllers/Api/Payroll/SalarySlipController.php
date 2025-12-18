<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Services\Payroll\PayrollService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Salary Slip Controller
 *
 * Handles HTTP requests for payroll/salary slip management.
 */
class SalarySlipController extends Controller
{
    use ApiResponse;

    protected PayrollService $service;

    public function __construct(PayrollService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of salary slips.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $params = $request->only([
                'staff_member_id',
                'status',
                'month',
                'year',
                'paginate',
                'per_page',
                'page',
            ]);

            $result = $this->service->getAllSalarySlips($params);

            return $this->success($result, 'Salary slips retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve salary slips: '.$e->getMessage());
        }
    }

    /**
     * Generate salary slip for an employee.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'staff_member_id' => 'required|exists:staff_members,id',
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2000|max:2100',
            ]);

            $slip = $this->service->generateSalarySlip(
                $validated['staff_member_id'],
                $validated['month'],
                $validated['year']
            );

            $slip->load(['staffMember', 'staffMember.jobTitle', 'staffMember.division']);

            return $this->created($slip, 'Salary slip generated successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to generate salary slip: '.$e->getMessage());
        }
    }

    /**
     * Display the specified salary slip.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $slip = $this->service->findById($id);

            if (! $slip) {
                return $this->notFound('Salary slip not found');
            }

            return $this->success($slip, 'Salary slip retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve salary slip: '.$e->getMessage());
        }
    }

    /**
     * Mark salary slip as paid.
     */
    public function markPaid(Request $request, int $id): JsonResponse
    {
        try {
            $data = $request->only(['payment_method', 'payment_reference']);

            $slip = $this->service->markAsPaid($id, $data);

            return $this->success($slip, 'Salary slip marked as paid');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Salary slip not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to mark salary slip as paid: '.$e->getMessage());
        }
    }

    /**
     * Bulk generate salary slips.
     */
    public function bulkGenerate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2000|max:2100',
                'employee_ids' => 'nullable|array',
                'employee_ids.*' => 'exists:staff_members,id',
            ]);

            $slips = $this->service->bulkGenerateSalarySlips(
                $validated['month'],
                $validated['year'],
                $validated['employee_ids'] ?? null
            );

            return $this->success([
                'generated' => $slips->count(),
                'slips' => $slips,
            ], 'Salary slips generated successfully');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to generate salary slips: '.$e->getMessage());
        }
    }

    /**
     * Bulk mark salary slips as paid.
     */
    public function bulkPay(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'slip_ids' => 'required|array|min:1',
                'slip_ids.*' => 'exists:salary_slips,id',
                'payment_method' => 'nullable|string',
                'payment_reference' => 'nullable|string',
            ]);

            $count = $this->service->bulkMarkAsPaid($validated['slip_ids'], [
                'payment_method' => $validated['payment_method'] ?? null,
                'payment_reference' => $validated['payment_reference'] ?? null,
            ]);

            return $this->success([
                'paid_count' => $count,
            ], 'Salary slips marked as paid');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors());
        } catch (\Exception $e) {
            return $this->serverError('Failed to mark salary slips as paid: '.$e->getMessage());
        }
    }

    /**
     * Get monthly payroll summary.
     */
    public function monthlySummary(Request $request): JsonResponse
    {
        try {
            $month = $request->input('month', now()->month);
            $year = $request->input('year', now()->year);

            $summary = $this->service->getMonthlyPayrollSummary($month, $year);

            return $this->success($summary, 'Monthly payroll summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve monthly summary: '.$e->getMessage());
        }
    }

    /**
     * Get employee salary history.
     */
    public function employeeHistory(int $staffMemberId): JsonResponse
    {
        try {
            $history = $this->service->getEmployeeSalaryHistory($staffMemberId);

            return $this->collection($history, 'Salary history retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve salary history: '.$e->getMessage());
        }
    }

    /**
     * Get payroll statistics.
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->service->getStatistics();

            return $this->success($stats, 'Payroll statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverError('Failed to retrieve payroll statistics: '.$e->getMessage());
        }
    }

    /**
     * Delete a salary slip.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return $this->noContent('Salary slip deleted successfully');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFound('Salary slip not found');
        } catch (\Exception $e) {
            return $this->serverError('Failed to delete salary slip: '.$e->getMessage());
        }
    }
}
