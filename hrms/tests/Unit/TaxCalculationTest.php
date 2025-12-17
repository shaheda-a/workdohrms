<?php

namespace Tests\Unit;

use App\Models\TaxSlab;
use PHPUnit\Framework\TestCase;

class TaxCalculationTest extends TestCase
{
    public function test_calculates_tax_for_income_in_slab(): void
    {
        $slab = new TaxSlab([
            'title' => 'Slab 1',
            'income_from' => 0,
            'income_to' => 50000,
            'fixed_amount' => 0,
            'percentage' => 10,
        ]);

        $tax = $slab->calculateTax(30000);
        $this->assertEquals(3000, $tax); // 10% of 30000
    }

    public function test_calculates_zero_tax_for_income_outside_slab(): void
    {
        $slab = new TaxSlab([
            'title' => 'Slab 2',
            'income_from' => 50001,
            'income_to' => 100000,
            'fixed_amount' => 5000,
            'percentage' => 20,
        ]);

        $tax = $slab->calculateTax(30000);
        $this->assertEquals(0, $tax);
    }

    public function test_includes_fixed_amount_in_tax(): void
    {
        $slab = new TaxSlab([
            'title' => 'Slab 2',
            'income_from' => 50001,
            'income_to' => 100000,
            'fixed_amount' => 5000,
            'percentage' => 20,
        ]);

        $tax = $slab->calculateTax(70000);
        // Fixed: 5000 + 20% of (70000 - 50001) = 5000 + 3999.8 = 8999.8
        $this->assertGreaterThan(5000, $tax);
    }
}
