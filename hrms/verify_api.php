<?php

/**
 * HRMS API Verification Script
 * Tests all major endpoints for the newly implemented modules
 */

$baseUrl = 'http://127.0.0.1:8000/api';
$token = null;

function makeRequest($method, $url, $data = null, $token = null) {
    global $baseUrl;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json'
    ];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true)
    ];
}

function test($name, $result) {
    $status = $result['code'] >= 200 && $result['code'] < 300 ? '✅' : '❌';
    echo sprintf("%s %s (HTTP %d)\n", $status, $name, $result['code']);
    if ($result['code'] >= 400) {
        echo "   Error: " . json_encode($result['body']) . "\n";
    }
    return $result['code'] >= 200 && $result['code'] < 300;
}

echo "===========================================\n";
echo "   HRMS API VERIFICATION TEST\n";
echo "===========================================\n\n";

// 1. Authentication
echo "📌 AUTHENTICATION\n";
echo "-------------------------------------------\n";
$loginResult = makeRequest('POST', '/auth/sign-in', [
    'email' => 'admin@hrms.local',
    'password' => 'password'
]);
test('Login', $loginResult);
$token = $loginResult['body']['data']['access_token'] ?? null;

if (!$token) {
    echo "❌ Cannot proceed without token!\n";
    exit(1);
}

echo "\n📌 CORE MODULES\n";
echo "-------------------------------------------\n";
test('Office Locations', makeRequest('GET', '/office-locations', null, $token));
test('Divisions', makeRequest('GET', '/divisions', null, $token));
test('Job Titles', makeRequest('GET', '/job-titles', null, $token));
test('Staff Members', makeRequest('GET', '/staff-members', null, $token));
test('Dashboard', makeRequest('GET', '/dashboard', null, $token));

echo "\n📌 PROMPT 23: ASSET MANAGEMENT\n";
echo "-------------------------------------------\n";
test('Asset Types - List', makeRequest('GET', '/asset-types', null, $token));
test('Assets - List', makeRequest('GET', '/assets', null, $token));
test('Available Assets', makeRequest('GET', '/assets-available', null, $token));

// Create Asset Type
$assetTypeResult = makeRequest('POST', '/asset-types', [
    'title' => 'Test Laptop',
    'description' => 'Test laptops for verification',
    'depreciation_rate' => 15.5
], $token);
test('Asset Type - Create', $assetTypeResult);
$assetTypeId = $assetTypeResult['body']['data']['id'] ?? null;

// Create Asset
if ($assetTypeId) {
    $assetResult = makeRequest('POST', '/assets', [
        'name' => 'MacBook Pro Test',
        'asset_type_id' => $assetTypeId,
        'serial_number' => 'TEST' . rand(1000, 9999),
        'purchase_date' => '2024-01-15',
        'purchase_cost' => 2499.00,
        'condition' => 'new'
    ], $token);
    test('Asset - Create', $assetResult);
}

echo "\n📌 PROMPT 24: TRAINING MANAGEMENT\n";
echo "-------------------------------------------\n";
test('Training Types - List', makeRequest('GET', '/training-types', null, $token));
test('Training Programs - List', makeRequest('GET', '/training-programs', null, $token));
test('Training Sessions - List', makeRequest('GET', '/training-sessions', null, $token));

// Create Training Type
$trainingTypeResult = makeRequest('POST', '/training-types', [
    'title' => 'Technical Skills',
    'description' => 'Technical training programs'
], $token);
test('Training Type - Create', $trainingTypeResult);

echo "\n📌 PROMPT 25-27: RECRUITMENT\n";
echo "-------------------------------------------\n";
test('Job Categories - List', makeRequest('GET', '/job-categories', null, $token));
test('Job Stages - List', makeRequest('GET', '/job-stages', null, $token));
test('Jobs - List', makeRequest('GET', '/jobs', null, $token));
test('Candidates - List', makeRequest('GET', '/candidates', null, $token));
test('Job Applications - List', makeRequest('GET', '/job-applications', null, $token));
test('Interview Schedules - List', makeRequest('GET', '/interview-schedules', null, $token));
test('Today\'s Interviews', makeRequest('GET', '/interviews/today', null, $token));

// Create Job Category
$jobCatResult = makeRequest('POST', '/job-categories', [
    'title' => 'Engineering',
    'description' => 'Software Engineering roles'
], $token);
test('Job Category - Create', $jobCatResult);

echo "\n📌 PROMPT 28: ONBOARDING\n";
echo "-------------------------------------------\n";
test('Onboarding Templates - List', makeRequest('GET', '/onboarding-templates', null, $token));
test('Employee Onboardings - List', makeRequest('GET', '/employee-onboardings', null, $token));
test('Pending Onboardings', makeRequest('GET', '/onboardings/pending', null, $token));

// Create Onboarding Template
$onboardingResult = makeRequest('POST', '/onboarding-templates', [
    'title' => 'New Employee Onboarding',
    'description' => '30-day onboarding checklist',
    'days_to_complete' => 30
], $token);
test('Onboarding Template - Create', $onboardingResult);

echo "\n📌 PROMPT 29: CONTRACT MANAGEMENT\n";
echo "-------------------------------------------\n";
test('Contract Types - List', makeRequest('GET', '/contract-types', null, $token));
test('Contracts - List', makeRequest('GET', '/contracts', null, $token));
test('Expiring Contracts', makeRequest('GET', '/contracts-expiring', null, $token));

// Create Contract Type
$contractTypeResult = makeRequest('POST', '/contract-types', [
    'title' => 'Full-Time Employment',
    'default_duration_months' => 12
], $token);
test('Contract Type - Create', $contractTypeResult);

echo "\n📌 PROMPT 30: MEETING MANAGEMENT\n";
echo "-------------------------------------------\n";
test('Meeting Types - List', makeRequest('GET', '/meeting-types', null, $token));
test('Meeting Rooms - List', makeRequest('GET', '/meeting-rooms', null, $token));
test('Available Rooms', makeRequest('GET', '/meeting-rooms-available', null, $token));
test('Meetings - List', makeRequest('GET', '/meetings', null, $token));
test('Meeting Calendar', makeRequest('GET', '/meetings-calendar', null, $token));
test('My Meetings', makeRequest('GET', '/my-meetings', null, $token));

// Create Meeting Type
$meetingTypeResult = makeRequest('POST', '/meeting-types', [
    'title' => 'Team Standup',
    'default_duration' => 15,
    'color' => '#10b981'
], $token);
test('Meeting Type - Create', $meetingTypeResult);

// Create Meeting Room
$roomResult = makeRequest('POST', '/meeting-rooms', [
    'name' => 'Conference Room A',
    'capacity' => 12,
    'location' => 'Floor 2'
], $token);
test('Meeting Room - Create', $roomResult);

echo "\n📌 PROMPT 31: SHIFTS MANAGEMENT\n";
echo "-------------------------------------------\n";
test('Shifts - List', makeRequest('GET', '/shifts', null, $token));
test('Shift Roster', makeRequest('GET', '/shift-roster', null, $token));

// Create Shift
$shiftResult = makeRequest('POST', '/shifts', [
    'name' => 'Morning Shift',
    'start_time' => '09:00',
    'end_time' => '17:00',
    'break_duration_minutes' => 60,
    'is_night_shift' => false
], $token);
test('Shift - Create', $shiftResult);

echo "\n📌 PROMPT 32: TIMESHEETS\n";
echo "-------------------------------------------\n";
test('Timesheet Projects - List', makeRequest('GET', '/timesheet-projects', null, $token));
test('Timesheets - List', makeRequest('GET', '/timesheets', null, $token));
test('Timesheet Summary', makeRequest('GET', '/timesheet-summary', null, $token));
test('Timesheet Report', makeRequest('GET', '/timesheet-report', null, $token));

// Create Timesheet Project
$projectResult = makeRequest('POST', '/timesheet-projects', [
    'name' => 'HRMS Development',
    'client_name' => 'Internal',
    'is_billable' => false,
    'hourly_rate' => 0
], $token);
test('Timesheet Project - Create', $projectResult);

echo "\n===========================================\n";
echo "   VERIFICATION COMPLETE\n";
echo "===========================================\n";
