<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\ContractType;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Contract Service
 * 
 * Handles all business logic for employee contracts.
 */
class ContractService extends BaseService
{
    protected string $modelClass = Contract::class;

    protected array $defaultRelations = [
        'staffMember',
        'contractType',
    ];

    protected array $searchableFields = [
        'contract_number',
    ];

    protected array $filterableFields = [
        'staff_member_id' => 'staff_member_id',
        'contract_type_id' => 'contract_type_id',
        'status' => 'status',
    ];

    /**
     * Get all contracts.
     */
    public function getAllContracts(array $params = [])
    {
        $query = $this->query()->with($this->defaultRelations);

        $query = $this->applyFilters($query, $params);

        if (!empty($params['search'])) {
            $query = $this->applySearch($query, $params['search']);
        }

        // Expiring soon filter (within 30 days)
        if (!empty($params['expiring_soon'])) {
            $query->where('end_date', '>=', now())
                  ->where('end_date', '<=', now()->addDays(30));
        }

        // Expired filter
        if (!empty($params['expired'])) {
            $query->where('end_date', '<', now());
        }

        $query = $this->applyOrdering($query, $params);

        $paginate = $params['paginate'] ?? true;
        $perPage = $params['per_page'] ?? $this->perPage;

        return $paginate 
            ? $query->paginate($perPage) 
            : $query->get();
    }

    /**
     * Create a new contract.
     */
    public function createContract(array $data, ?int $authorId = null): Contract
    {
        if ($authorId) {
            $data['author_id'] = $authorId;
        }

        // Generate contract number if not provided
        if (empty($data['contract_number'])) {
            $data['contract_number'] = 'CTR-' . date('Y') . '-' . str_pad(Contract::count() + 1, 5, '0', STR_PAD_LEFT);
        }

        $data['status'] = $data['status'] ?? 'active';

        return Contract::create($data);
    }

    /**
     * Update contract.
     */
    public function updateContract(int $id, array $data): Contract
    {
        $contract = Contract::findOrFail($id);
        $contract->update($data);
        return $contract->fresh($this->defaultRelations);
    }

    /**
     * Delete contract.
     */
    public function deleteContract(int $id): bool
    {
        return Contract::findOrFail($id)->delete();
    }

    /**
     * Terminate contract.
     */
    public function terminateContract(int $id, array $data = []): Contract
    {
        $contract = Contract::findOrFail($id);
        $contract->update([
            'status' => 'terminated',
            'termination_date' => $data['termination_date'] ?? now(),
            'termination_reason' => $data['termination_reason'] ?? null,
        ]);
        return $contract->fresh($this->defaultRelations);
    }

    /**
     * Renew contract.
     */
    public function renewContract(int $id, array $data): Contract
    {
        return DB::transaction(function () use ($id, $data) {
            // Mark old contract as completed
            $oldContract = Contract::findOrFail($id);
            $oldContract->update(['status' => 'completed']);

            // Create new contract
            return $this->createContract([
                'staff_member_id' => $oldContract->staff_member_id,
                'contract_type_id' => $data['contract_type_id'] ?? $oldContract->contract_type_id,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'salary' => $data['salary'] ?? $oldContract->salary,
                'terms' => $data['terms'] ?? $oldContract->terms,
                'previous_contract_id' => $oldContract->id,
            ]);
        });
    }

    /**
     * Get contracts expiring soon.
     */
    public function getExpiringSoon(int $days = 30): Collection
    {
        return Contract::with($this->defaultRelations)
            ->where('status', 'active')
            ->where('end_date', '>=', now())
            ->where('end_date', '<=', now()->addDays($days))
            ->orderBy('end_date')
            ->get();
    }

    /**
     * Get expired contracts.
     */
    public function getExpired(): Collection
    {
        return Contract::with($this->defaultRelations)
            ->where('status', 'active')
            ->where('end_date', '<', now())
            ->orderByDesc('end_date')
            ->get();
    }

    /**
     * Get contract statistics.
     */
    public function getStatistics(): array
    {
        return [
            'total' => Contract::count(),
            'active' => Contract::where('status', 'active')->count(),
            'expiring_soon' => Contract::where('status', 'active')
                ->where('end_date', '>=', now())
                ->where('end_date', '<=', now()->addDays(30))
                ->count(),
            'expired' => Contract::where('status', 'active')
                ->where('end_date', '<', now())
                ->count(),
        ];
    }

    /**
     * Get employee's active contract.
     */
    public function getActiveContract(int $staffMemberId): ?Contract
    {
        return Contract::with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Get employee contract history.
     */
    public function getContractHistory(int $staffMemberId): Collection
    {
        return Contract::with($this->defaultRelations)
            ->where('staff_member_id', $staffMemberId)
            ->orderByDesc('start_date')
            ->get();
    }

    // ========================================
    // CONTRACT TYPES
    // ========================================

    /**
     * Get all contract types.
     */
    public function getAllTypes(): Collection
    {
        return ContractType::orderBy('title')->get();
    }

    /**
     * Create contract type.
     */
    public function createType(array $data): ContractType
    {
        return ContractType::create($data);
    }

    /**
     * Update contract type.
     */
    public function updateType(int $id, array $data): ContractType
    {
        $type = ContractType::findOrFail($id);
        $type->update($data);
        return $type->fresh();
    }

    /**
     * Delete contract type.
     */
    public function deleteType(int $id): bool
    {
        return ContractType::findOrFail($id)->delete();
    }
}
