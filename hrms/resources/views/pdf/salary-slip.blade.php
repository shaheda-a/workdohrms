<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Salary Slip - {{ $slip->slip_reference }}</title>
    <style>
        body { 
            font-family: 'DejaVu Sans', sans-serif; 
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .company-details {
            font-size: 12px;
            color: #666;
            margin-bottom: 15px;
        }
        .slip-title {
            font-size: 20px;
            font-weight: bold;
            color: #3498db;
            margin: 15px 0;
        }
        .section {
            margin: 25px 0;
        }
        .section-title {
            background: #f8f9fa;
            padding: 8px 12px;
            font-weight: bold;
            border-left: 4px solid #3498db;
            margin-bottom: 15px;
            color: #2c3e50;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background: #f8f9fa;
            font-weight: bold;
            text-align: left;
            padding: 10px;
            border: 1px solid #dee2e6;
        }
        td {
            padding: 10px;
            border: 1px solid #dee2e6;
            text-align: left;
        }
        .text-right {
            text-align: right;
        }
        .total-row {
            font-weight: bold;
            background: #f8f9fa;
        }
        .net-payable {
            font-size: 16px;
            color: #2c3e50;
            background: #e8f4fc;
        }
        .footer {
            margin-top: 50px;
            font-size: 11px;
            color: #777;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        .signature-section {
            margin-top: 40px;
        }
        .signature-line {
            border-top: 1px solid #000;
            width: 200px;
            margin: 30px auto 5px;
        }
        .signature-label {
            font-size: 12px;
            text-align: center;
            margin-bottom: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-paid { background: #d4edda; color: #155724; }
        .status-generated { background: #fff3cd; color: #856404; }
        .status-draft { background: #e2e3e5; color: #383d41; }
        .info-row {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        .info-value {
            display: inline-block;
        }
        .employee-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #3498db;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <div class="company-name">{{ $company->name ?? 'Your Company Name' }}</div>
            <div class="company-details">
                {{ $company->address ?? '123 Main Street, City, Country' }}<br>
                Phone: {{ $company->phone ?? '(+123) 456-7890' }} | Email: {{ $company->email ?? 'info@company.com' }}
            </div>
            <div class="slip-title">SALARY SLIP</div>
            <div style="font-size: 14px;">
                <strong>Period:</strong> {{ $slip->salary_period ?? 'N/A' }} | 
                <strong>Reference:</strong> {{ $slip->slip_reference ?? 'N/A' }} |
                <strong>Date:</strong> {{ date('Y-m-d') }}
            </div>
        </div>

        <!-- Employee Information -->
        <div class="section">
            <div class="section-title">Employee Information</div>
            <div class="employee-info">
                <div class="info-row">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">{{ $slip->staff_member->full_name ?? 'N/A' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Employee ID:</span>
                    <span class="info-value">{{ $slip->staff_member->staff_code ?? 'N/A' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Designation:</span>
                    <span class="info-value">{{ $slip->staff_member->job_title->title ?? 'N/A' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span class="info-value">
                        @if(isset($slip->staff_member->division->name) && $slip->staff_member->division->name)
                            {{ $slip->staff_member->division->name }}
                        @else
                            N/A
                        @endif
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Pay Date:</span>
                    <span class="info-value">{{ date('Y-m-d') }}</span>
                </div>
            </div>
        </div>

        <!-- Earnings Section -->
        <div class="section">
            <div class="section-title">Earnings</div>
            <table>
                <thead>
                    <tr>
                        <th width="70%">Description</th>
                        <th width="30%" class="text-right">Amount (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Basic Salary -->
                    <tr>
                        <td>Basic Salary</td>
                        <td class="text-right">{{ number_format($slip->basic_salary, 2) }}</td>
                    </tr>

                    <!-- Benefits -->
                    @php
                        $benefits = [];
                        if (isset($slip->benefits_breakdown) && is_array($slip->benefits_breakdown)) {
                            $benefits = $slip->benefits_breakdown;
                        } elseif (isset($slip->benefits_breakdown) && is_string($slip->benefits_breakdown)) {
                            $benefits = json_decode($slip->benefits_breakdown, true) ?? [];
                        }
                    @endphp
                    
                    @if(!empty($benefits))
                        @foreach($benefits as $benefit)
                            @if(is_array($benefit) && isset($benefit['amount']) && floatval($benefit['amount']) > 0)
                            <tr>
                                <td>{{ $benefit['name'] ?? 'Benefit' }}</td>
                                <td class="text-right">{{ number_format($benefit['amount'], 2) }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif

                    <!-- Incentives -->
                    @php
                        $incentives = [];
                        if (isset($slip->incentives_breakdown) && is_array($slip->incentives_breakdown)) {
                            $incentives = $slip->incentives_breakdown;
                        } elseif (isset($slip->incentives_breakdown) && is_string($slip->incentives_breakdown)) {
                            $incentives = json_decode($slip->incentives_breakdown, true) ?? [];
                        }
                    @endphp
                    
                    @if(!empty($incentives))
                        @foreach($incentives as $incentive)
                            @if(is_array($incentive) && isset($incentive['amount']) && floatval($incentive['amount']) > 0)
                            <tr>
                                <td>{{ $incentive['name'] ?? 'Incentive' }}</td>
                                <td class="text-right">{{ number_format($incentive['amount'], 2) }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif

                    <!-- Bonus -->
                    @php
                        $bonuses = [];
                        if (isset($slip->bonus_breakdown) && is_array($slip->bonus_breakdown)) {
                            $bonuses = $slip->bonus_breakdown;
                        } elseif (isset($slip->bonus_breakdown) && is_string($slip->bonus_breakdown)) {
                            $bonuses = json_decode($slip->bonus_breakdown, true) ?? [];
                        }
                    @endphp
                    
                    @if(!empty($bonuses))
                        @foreach($bonuses as $bonus)
                            @if(is_array($bonus) && isset($bonus['amount']) && floatval($bonus['amount']) > 0)
                            <tr>
                                <td>{{ $bonus['name'] ?? 'Bonus' }}</td>
                                <td class="text-right">{{ number_format($bonus['amount'], 2) }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif

                    <!-- Overtime -->
                    @php
                        $overtimes = [];
                        if (isset($slip->overtime_breakdown) && is_array($slip->overtime_breakdown)) {
                            $overtimes = $slip->overtime_breakdown;
                        } elseif (isset($slip->overtime_breakdown) && is_string($slip->overtime_breakdown)) {
                            $overtimes = json_decode($slip->overtime_breakdown, true) ?? [];
                        }
                    @endphp
                    
                    @if(!empty($overtimes))
                        @foreach($overtimes as $overtime)
                            @if(is_array($overtime) && isset($overtime['amount']) && floatval($overtime['amount']) > 0)
                            <tr>
                                <td>{{ $overtime['name'] ?? 'Overtime' }}</td>
                                <td class="text-right">{{ number_format($overtime['amount'], 2) }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif

                    <!-- Total Earnings -->
                    <tr class="total-row">
                        <td><strong>Total Earnings</strong></td>
                        <td class="text-right"><strong>{{ number_format($slip->total_earnings, 2) }}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Deductions Section -->
        <div class="section">
            <div class="section-title">Deductions</div>
            <table>
                <thead>
                    <tr>
                        <th width="70%">Description</th>
                        <th width="30%" class="text-right">Amount (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Tax -->
                    @php
                        $taxes = [];
                        if (isset($slip->tax_breakdown) && is_array($slip->tax_breakdown)) {
                            $taxes = $slip->tax_breakdown;
                        } elseif (isset($slip->tax_breakdown) && is_string($slip->tax_breakdown)) {
                            $taxes = json_decode($slip->tax_breakdown, true) ?? [];
                        }
                    @endphp
                    
                    @if(!empty($taxes))
                        @foreach($taxes as $tax)
                            @if(is_array($tax) && isset($tax['amount']) && floatval($tax['amount']) > 0)
                            <tr>
                                <td>{{ $tax['name'] ?? 'Tax' }}</td>
                                <td class="text-right">{{ number_format($tax['amount'], 2) }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif

                    <!-- Deductions -->
                    @php
                        $deductions = [];
                        if (isset($slip->deductions_breakdown) && is_array($slip->deductions_breakdown)) {
                            $deductions = $slip->deductions_breakdown;
                        } elseif (isset($slip->deductions_breakdown) && is_string($slip->deductions_breakdown)) {
                            $deductions = json_decode($slip->deductions_breakdown, true) ?? [];
                        }
                    @endphp
                    
                    @if(!empty($deductions))
                        @foreach($deductions as $deduction)
                            @if(is_array($deduction) && isset($deduction['amount']) && floatval($deduction['amount']) > 0)
                            <tr>
                                <td>{{ $deduction['name'] ?? 'Deduction' }}</td>
                                <td class="text-right">{{ number_format($deduction['amount'], 2) }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif

                    <!-- Contributions -->
                    @php
                        $contributions = [];
                        if (isset($slip->contributions_breakdown) && is_array($slip->contributions_breakdown)) {
                            $contributions = $slip->contributions_breakdown;
                        } elseif (isset($slip->contributions_breakdown) && is_string($slip->contributions_breakdown)) {
                            $contributions = json_decode($slip->contributions_breakdown, true) ?? [];
                        }
                    @endphp
                    
                    @if(!empty($contributions))
                        @foreach($contributions as $contribution)
                            @if(is_array($contribution) && isset($contribution['amount']) && floatval($contribution['amount']) > 0)
                            <tr>
                                <td>{{ $contribution['name'] ?? 'Contribution' }}</td>
                                <td class="text-right">{{ number_format($contribution['amount'], 2) }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif

                    <!-- Advances -->
                    @php
                        $advances = [];
                        if (isset($slip->advances_breakdown) && is_array($slip->advances_breakdown)) {
                            $advances = $slip->advances_breakdown;
                        } elseif (isset($slip->advances_breakdown) && is_string($slip->advances_breakdown)) {
                            $advances = json_decode($slip->advances_breakdown, true) ?? [];
                        }
                    @endphp
                    
                    @if(!empty($advances))
                        @foreach($advances as $advance)
                            @if(is_array($advance) && isset($advance['amount']) && floatval($advance['amount']) > 0)
                            <tr>
                                <td>{{ $advance['name'] ?? 'Advance' }}</td>
                                <td class="text-right">{{ number_format($advance['amount'], 2) }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif

                    <!-- Total Deductions -->
                    <tr class="total-row">
                        <td><strong>Total Deductions</strong></td>
                        <td class="text-right"><strong>{{ number_format($slip->total_deductions, 2) }}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Summary Section -->
        <div class="section">
            <table>
                <tr class="net-payable">
                    <td width="70%"><strong>NET PAYABLE</strong></td>
                    <td width="30%" class="text-right" style="font-size: 18px;">
                        <strong>{{ number_format($slip->net_payable, 2) }}</strong>
                    </td>
                </tr>
                <tr>
                    <td><strong>Status:</strong></td>
                    <td class="text-right">
                        @php
                            $statusClass = 'status-' . $slip->status;
                            $statusText = ucfirst($slip->status);
                        @endphp
                        <span class="status-badge {{ $statusClass }}">{{ $statusText }}</span>
                    </td>
                </tr>
                @if($slip->paid_at)
                <tr>
                    <td><strong>Paid On:</strong></td>
                    <td class="text-right">{{ \Carbon\Carbon::parse($slip->paid_at)->format('Y-m-d') }}</td>
                </tr>
                @endif
            </table>
        </div>

        <!-- Signatures Section -->
        <!-- <div class="signature-section">
            <table>
                <tr>
                    <td width="33%" style="text-align: center;">
                        <div class="signature-line"></div>
                        <div class="signature-label">Employee Signature</div>
                    </td>
                    <td width="33%" style="text-align: center;">
                        <div class="signature-line"></div>
                        <div class="signature-label">HR Manager</div>
                    </td>
                    <td width="33%" style="text-align: center;">
                        <div class="signature-line"></div>
                        <div class="signature-label">Finance Department</div>
                    </td>
                </tr>
            </table>
        </div> -->

        <!-- Footer -->
        <div class="footer">
            <p>This is a computer generated document. No signature is required.</p>
            <p>Generated on: {{ date('Y-m-d H:i:s') }}</p>
            <p>Confidential - For employee use only</p>
        </div>
    </div>
</body>
</html>