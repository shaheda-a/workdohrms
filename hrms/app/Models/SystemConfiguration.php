<?php

namespace App\Models;

use App\Traits\HasOrgAndCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemConfiguration extends Model
{
    use HasFactory, HasOrgAndCompany;

    protected $fillable = [
        'config_key',
        'config_value',
        'config_type',
        'category',
        'notes',
        'tenant_id',
    ];

    /**
     * Get a configuration value.
     */
    public static function getValue(string $key, $default = null)
    {
        $config = Cache::remember("config_{$key}", 3600, function () use ($key) {
            return static::where('config_key', $key)->first();
        });

        if (! $config) {
            return $default;
        }

        return static::castValue($config->config_value, $config->config_type);
    }

    /**
     * Set a configuration value.
     */
    public static function setValue(string $key, $value, string $type = 'string', string $category = 'general'): void
    {
        static::updateOrCreate(
            ['config_key' => $key],
            [
                'config_value' => is_array($value) ? json_encode($value) : $value,
                'config_type' => $type,
                'category' => $category,
            ]
        );

        Cache::forget("config_{$key}");
    }

    /**
     * Cast value to proper type.
     */
    protected static function castValue($value, string $type)
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'float' => (float) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Get all configurations by category.
     */
    public static function getByCategory(string $category): array
    {
        return static::where('category', $category)
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->config_key => static::castValue($item->config_value, $item->config_type)];
            })
            ->toArray();
    }
}
