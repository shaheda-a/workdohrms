<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\ContractType;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContractTypeController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = ContractType::withCount('contracts');
        $types = $request->paginate === 'false' ? $query->get() : $query->paginate($request->per_page ?? 15);

        return $this->success($types);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_duration_months' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $type = ContractType::create($request->all());

        return $this->created($type, 'Contract type created');
    }

    public function show(ContractType $contractType)
    {
        return $this->success($contractType);
    }

    public function update(Request $request, ContractType $contractType)
    {
        $contractType->update($request->all());

        return $this->success($contractType, 'Updated');
    }

    public function destroy(ContractType $contractType)
    {
        $contractType->delete();

        return $this->noContent('Deleted');
    }
}
