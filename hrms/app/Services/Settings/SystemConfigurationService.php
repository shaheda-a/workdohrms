<?php

namespace App\Services\Settings;
use App\Services\Core\BaseService;

use App\Models\AllowedIpAddress;
use App\Models\SystemConfiguration;
use Illuminate\Support\Collection;

/**
 * System Configuration Service
 *
 * Handles all business logic for system configuration management.
 */
class SystemConfigurationService extends BaseService
{
    protected string $modelClass = SystemConfiguration::class;

    /**
     * Get all configurations.
     */
    public function getAll(): Collection
    {
        return SystemConfiguration::all();
    }

    /**
     * Get configuration by key.
     */
    public function get(string $key, $default = null)
    {
        $config = SystemConfiguration::where('key', $key)->first();

        return $config ? $config->value : $default;
    }

    /**
     * Set configuration value.
     */
    public function set(string $key, $value): SystemConfiguration
    {
        return SystemConfiguration::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    /**
     * Delete configuration.
     */
    public function delete(string $key): bool
    {
        return SystemConfiguration::where('key', $key)->delete() > 0;
    }

    /**
     * Get configurations by group.
     */
    public function getByGroup(string $group): Collection
    {
        return SystemConfiguration::where('group', $group)->get();
    }

    /**
     * Bulk update configurations.
     */
    public function bulkUpdate(array $configurations): Collection
    {
        $updated = collect();
        foreach ($configurations as $key => $value) {
            $updated->push($this->set($key, $value));
        }

        return $updated;
    }

    // ========================================
    // ALLOWED IP ADDRESSES
    // ========================================

    /**
     * Get all allowed IP addresses.
     */
    public function getAllowedIps(): Collection
    {
        return AllowedIpAddress::orderBy('ip_address')->get();
    }

    /**
     * Add allowed IP address.
     */
    public function addAllowedIp(array $data): AllowedIpAddress
    {
        return AllowedIpAddress::create($data);
    }

    /**
     * Update allowed IP address.
     */
    public function updateAllowedIp(int $id, array $data): AllowedIpAddress
    {
        $ip = AllowedIpAddress::findOrFail($id);
        $ip->update($data);

        return $ip->fresh();
    }

    /**
     * Delete allowed IP address.
     */
    public function deleteAllowedIp(int $id): bool
    {
        return AllowedIpAddress::findOrFail($id)->delete();
    }

    /**
     * Check if IP is allowed.
     */
    public function isIpAllowed(string $ipAddress): bool
    {
        $allowedIps = AllowedIpAddress::where('is_active', true)->pluck('ip_address')->toArray();

        if (empty($allowedIps)) {
            return true;
        }

        return in_array($ipAddress, $allowedIps);
    }
}
