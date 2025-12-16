<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BonusPayment;
use Illuminate\Http\Request;

class BonusPaymentController extends Controller
{
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

        return response()->json(['success' => true, 'data' => $payments]);
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

        return response()->json([
            'success' => true,
            'message' => 'Bonus payment created',
            'data' => $payment->load('staffMember'),
        ], 201);
    }

    public function show(BonusPayment $bonusPayment)
    {
        return response()->json([
            'success' => true,
            'data' => $bonusPayment->load(['staffMember', 'author']),
        ]);
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

        return response()->json([
            'success' => true,
            'message' => 'Bonus payment updated',
            'data' => $bonusPayment->fresh('staffMember'),
        ]);
    }

    public function destroy(BonusPayment $bonusPayment)
    {
        $bonusPayment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Bonus payment deleted',
        ]);
    }
}
