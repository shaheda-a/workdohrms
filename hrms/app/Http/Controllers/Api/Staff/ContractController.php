<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractRenewal;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    use ApiResponse;

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

        return $this->success($contracts);
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
            return $this->validationError($validator->errors());
        }

        $data = $request->all();
        $data['reference_number'] = 'CTR-'.strtoupper(Str::random(8));
        $data['status'] = 'draft';

        $contract = Contract::create($data);

        return $this->created($contract->load(['staffMember', 'contractType']), 'Contract created');

        return $this->success($contract);
    }

    public function update(Request $request, Contract $contract)
    {
        $contract->update($request->all());

        return $this->success($contract, 'Updated');
    }

    public function destroy(Contract $contract)
    {
        $contract->delete();

        return $this->noContent('Deleted');
    }

    public function renew(Request $request, Contract $contract)
    {
        $validator = Validator::make($request->all(), [
            'new_end_date' => 'required|date|after:'.$contract->end_date,
            'new_salary' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
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

        return $this->success($contract->load('renewals'), 'Contract renewed');
    }

    public function terminate(Request $request, Contract $contract)
    {
        $contract->update(['status' => 'terminated']);

        return $this->success($contract, 'Contract terminated');
    }

    public function expiring(Request $request)
    {
        $days = $request->days ?? 30;
        $contracts = Contract::expiringSoon($days)->with(['staffMember', 'contractType'])->get();

        return $this->success($contracts);
    }

    public function byEmployee($staffMemberId)
    {
        $contracts = Contract::where('staff_member_id', $staffMemberId)
            ->with('contractType')
            ->orderBy('start_date', 'desc')
            ->get();

        return $this->success($contracts);
    }
}
