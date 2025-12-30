<?php

namespace App\Http\Controllers\Api\Payroll;

use App\Http\Controllers\Controller;
use App\Models\BonusPayment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class BonusPaymentController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = BonusPayment::with(['staffMember', 'author']);

        if ($request->filled('staff_member_id')) {
            $query->where('staff_member_id', $request->staff_member_id);
        }
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('payment_date', [$request->start_date, $request->end_date]);
        }

        $payments = $request->boolean('paginate', true)
            ? $query->latest()->paginate($request->input('per_page', 15))
            : $query->latest()->get();

        return $this->success($payments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_member_id' => 'required|exists:staff_members,id',
            'title' => 'required|string|max:255',
            'payment_type' => 'required|in:fixed,percentage',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $payment = BonusPayment::create($validated);

        return $this->created($payment->load('staffMember'), 'Bonus payment created');
    }

    public function show(BonusPayment $bonusPayment)
    {
        return $this->success($bonusPayment->load(['staffMember', 'author']));
    }

    public function update(Request $request, BonusPayment $bonusPayment)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'payment_type' => 'sometimes|required|in:fixed,percentage',
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
        ]);

        $bonusPayment->update($validated);

        return $this->success($bonusPayment->fresh('staffMember'), 'Bonus payment updated');
    }

    public function destroy(BonusPayment $bonusPayment)
    {
        $bonusPayment->delete();

        return $this->noContent('Bonus payment deleted');
    }
}
