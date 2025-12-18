<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractRenewal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        $query = Contract::with(['staffMember', 'contractType']);

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->staff_member_id) {
            $query->where('staff_member_id', $request->staff_member_id);
        }

        $contracts = $query->paginate($request->per_page ?? 15);
        return response()->json(['success' => true, 'data' => $contracts]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_member_id' => 'required|exists:staff_members,id',
            'contract_type_id' => 'nullable|exists:contract_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'salary' => 'nullable|numeric|min:0',
            'terms' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['reference_number'] = 'CTR-' . strtoupper(Str::random(8));
        $data['status'] = 'draft';

        $contract = Contract::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Contract created',
            'data' => $contract->load(['staffMember', 'contractType'])
        ], 201);
    }

    public function show(Contract $contract)
    {
        $contract->load(['staffMember', 'contractType', 'renewals']);
        return response()->json(['success' => true, 'data' => $contract]);
    }

    public function update(Request $request, Contract $contract)
    {
        $contract->update($request->all());
        return response()->json(['success' => true, 'message' => 'Updated', 'data' => $contract]);
    }

    public function destroy(Contract $contract)
    {
        $contract->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }

    public function renew(Request $request, Contract $contract)
    {
        $validator = Validator::make($request->all(), [
            'new_end_date' => 'required|date|after:' . $contract->end_date,
            'new_salary' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        ContractRenewal::create([
            'contract_id' => $contract->id,
            'old_end_date' => $contract->end_date,
            'new_end_date' => $request->new_end_date,
            'new_salary' => $request->new_salary,
            'notes' => $request->notes,
            'renewed_by' => auth()->id(),
            'renewed_at' => now(),
        ]);

        $contract->update([
            'end_date' => $request->new_end_date,
            'salary' => $request->new_salary ?? $contract->salary,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contract renewed',
            'data' => $contract->load('renewals')
        ]);
    }

    public function terminate(Request $request, Contract $contract)
    {
        $contract->update(['status' => 'terminated']);
        return response()->json(['success' => true, 'message' => 'Contract terminated', 'data' => $contract]);
    }

    public function expiring(Request $request)
    {
        $days = $request->days ?? 30;
        $contracts = Contract::expiringSoon($days)->with(['staffMember', 'contractType'])->get();
        return response()->json(['success' => true, 'data' => $contracts]);
    }

    public function byEmployee($staffMemberId)
    {
        $contracts = Contract::where('staff_member_id', $staffMemberId)
            ->with('contractType')
            ->orderBy('start_date', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $contracts]);
    }
}
