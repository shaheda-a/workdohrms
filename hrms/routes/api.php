<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AccessController;
use App\Http\Controllers\Api\OfficeLocationController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\JobTitleController;
use App\Http\Controllers\Api\FileCategoryController;
use App\Http\Controllers\Api\StaffMemberController;
use App\Http\Controllers\Api\StaffFileController;
use App\Http\Controllers\Api\RecognitionCategoryController;
use App\Http\Controllers\Api\RecognitionRecordController;
use App\Http\Controllers\Api\RoleUpgradeController;
use App\Http\Controllers\Api\LocationTransferController;
use App\Http\Controllers\Api\DisciplineNoteController;
use App\Http\Controllers\Api\ExitCategoryController;
use App\Http\Controllers\Api\OffboardingController;
use App\Http\Controllers\Api\VoluntaryExitController;
use App\Http\Controllers\Api\BusinessTripController;
use App\Http\Controllers\Api\GrievanceController;
use App\Http\Controllers\Api\CompanyNoticeController;
use App\Http\Controllers\Api\CompanyHolidayController;
use App\Http\Controllers\Api\TimeOffCategoryController;
use App\Http\Controllers\Api\TimeOffRequestController;
use App\Http\Controllers\Api\WorkLogController;
use App\Http\Controllers\Api\CompensationCategoryController;
use App\Http\Controllers\Api\BenefitTypeController;
use App\Http\Controllers\Api\AdvanceTypeController;
use App\Http\Controllers\Api\WithholdingTypeController;
use App\Http\Controllers\Api\StaffBenefitController;
use App\Http\Controllers\Api\IncentiveRecordController;
use App\Http\Controllers\Api\SalaryAdvanceController;
use App\Http\Controllers\Api\RecurringDeductionController;
use App\Http\Controllers\Api\BonusPaymentController;
use App\Http\Controllers\Api\ExtraHoursRecordController;
use App\Http\Controllers\Api\EmployerContributionController;
use App\Http\Controllers\Api\SalarySlipController;
use App\Http\Controllers\Api\TaxSlabController;
use App\Http\Controllers\Api\TaxExemptionController;
use App\Http\Controllers\Api\MinimumTaxLimitController;
use App\Http\Controllers\Api\CompanyEventController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\OrganizationPolicyController;
use App\Http\Controllers\Api\OrganizationDocumentController;
use App\Http\Controllers\Api\LetterTemplateController;
use App\Http\Controllers\Api\GeneratedLetterController;
use App\Http\Controllers\Api\AllowedIpAddressController;
use App\Http\Controllers\Api\SystemConfigurationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\DataTableController;
use App\Http\Controllers\Api\DataImportController;
use App\Http\Controllers\Api\DataExportController;
use App\Http\Controllers\Api\PerformanceObjectiveController;
use App\Http\Controllers\Api\AppraisalCycleController;
use App\Http\Controllers\Api\AppraisalRecordController;
use App\Http\Controllers\Api\AssetTypeController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\TrainingTypeController;
use App\Http\Controllers\Api\TrainingProgramController;
use App\Http\Controllers\Api\TrainingSessionController;
use App\Http\Controllers\Api\JobCategoryController;
use App\Http\Controllers\Api\JobStageController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\CandidateController;
use App\Http\Controllers\Api\JobApplicationController;
use App\Http\Controllers\Api\InterviewScheduleController;
use App\Http\Controllers\Api\OnboardingTemplateController;
use App\Http\Controllers\Api\EmployeeOnboardingController;
use App\Http\Controllers\Api\ContractTypeController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\MeetingTypeController;
use App\Http\Controllers\Api\MeetingRoomController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\TimesheetProjectController;
use App\Http\Controllers\Api\TimesheetController;
use App\Http\Controllers\Api\DocumentCategoryController;
use App\Http\Controllers\Api\HrDocumentController;
use App\Http\Controllers\Api\MediaDirectoryController;
use App\Http\Controllers\Api\MediaFileController;
use App\Http\Controllers\Api\JobRequisitionController;
use App\Http\Controllers\Api\OfferTemplateController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\CandidateAssessmentController;
use App\Http\Controllers\Api\AttendanceRegularizationController;
use App\Http\Controllers\Api\DashboardController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/sign-up', [AccessController::class, 'signUp']);
    Route::post('/sign-in', [AccessController::class, 'signIn']);
    Route::post('/forgot-password', [AccessController::class, 'forgotPassword']);
    Route::post('/reset-password', [AccessController::class, 'resetPassword']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/sign-out', [AccessController::class, 'signOut']);
        Route::get('/profile', [AccessController::class, 'profile']);
    });

    // ============================================
    // Dashboard
    // ============================================
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/employee-stats', [DashboardController::class, 'employeeStats']);
    Route::get('/dashboard/attendance-summary', [DashboardController::class, 'attendanceSummary']);
    Route::get('/dashboard/employee-growth', [DashboardController::class, 'employeeGrowth']);
    Route::get('/dashboard/department-distribution', [DashboardController::class, 'departmentDistribution']);

    // ============================================
    // PROMPT SET 2: Organization Structure
    // ============================================
    Route::apiResource('office-locations', OfficeLocationController::class);
    Route::apiResource('divisions', DivisionController::class);
    Route::apiResource('job-titles', JobTitleController::class);
    Route::apiResource('file-categories', FileCategoryController::class);

    // AJAX endpoints for cascading dropdowns
    Route::post('/fetch-divisions', [DivisionController::class, 'fetchByLocation']);
    Route::post('/fetch-job-titles', [JobTitleController::class, 'fetchByDivision']);

    // ============================================
    // PROMPT SET 3: Staff Member Management
    // ============================================
    Route::apiResource('staff-members', StaffMemberController::class);
    Route::get('/staff-members-dropdown', [StaffMemberController::class, 'dropdown']);
    
    // Staff Files (nested resource)
    Route::get('/staff-members/{staffMember}/files', [StaffFileController::class, 'index']);
    Route::post('/staff-members/{staffMember}/files', [StaffFileController::class, 'store']);
    Route::get('/staff-members/{staffMember}/files/{file}', [StaffFileController::class, 'show']);
    Route::delete('/staff-members/{staffMember}/files/{file}', [StaffFileController::class, 'destroy']);

    // ============================================
    // PROMPT SET 4: Recognition & Advancement
    // ============================================
    Route::apiResource('recognition-categories', RecognitionCategoryController::class);
    Route::apiResource('recognition-records', RecognitionRecordController::class);
    Route::apiResource('role-upgrades', RoleUpgradeController::class);
    Route::apiResource('location-transfers', LocationTransferController::class);

    // ============================================
    // PROMPT SET 5: Discipline & Exit
    // ============================================
    Route::apiResource('discipline-notes', DisciplineNoteController::class);
    Route::apiResource('exit-categories', ExitCategoryController::class);
    Route::apiResource('offboardings', OffboardingController::class);
    Route::apiResource('voluntary-exits', VoluntaryExitController::class);
    Route::post('/voluntary-exits/{voluntaryExit}/process', [VoluntaryExitController::class, 'processApproval']);

    // ============================================
    // PROMPT SET 6: Business Trips & Grievances
    // ============================================
    Route::apiResource('business-trips', BusinessTripController::class);
    Route::post('/business-trips/{businessTrip}/process', [BusinessTripController::class, 'processApproval']);
    
    Route::apiResource('grievances', GrievanceController::class);
    Route::post('/grievances/{grievance}/status', [GrievanceController::class, 'updateStatus']);
    
    Route::apiResource('company-notices', CompanyNoticeController::class);
    Route::post('/company-notices/{companyNotice}/read', [CompanyNoticeController::class, 'markAsRead']);
    
    Route::apiResource('company-holidays', CompanyHolidayController::class);
    Route::post('/company-holidays/bulk-import', [CompanyHolidayController::class, 'bulkImport']);

    // ============================================
    // PROMPT SET 7: Leave Management
    // ============================================
    Route::apiResource('time-off-categories', TimeOffCategoryController::class);
    Route::apiResource('time-off-requests', TimeOffRequestController::class);
    Route::post('/time-off-requests/{timeOffRequest}/process', [TimeOffRequestController::class, 'processApproval']);
    Route::get('/time-off-balance', [TimeOffRequestController::class, 'getBalance']);

    // ============================================
    // PROMPT SET 8: Attendance Management
    // ============================================
    Route::apiResource('work-logs', WorkLogController::class);
    Route::post('/clock-in', [WorkLogController::class, 'clockIn']);
    Route::post('/clock-out', [WorkLogController::class, 'clockOut']);
    Route::post('/work-logs/bulk', [WorkLogController::class, 'bulkStore']);
    Route::get('/attendance-summary', [WorkLogController::class, 'summary']);

    // ============================================
    // PROMPT SET 9: Payroll Setup
    // ============================================
    Route::apiResource('compensation-categories', CompensationCategoryController::class);
    Route::apiResource('benefit-types', BenefitTypeController::class);
    Route::apiResource('advance-types', AdvanceTypeController::class);
    Route::apiResource('withholding-types', WithholdingTypeController::class);

    // ============================================
    // PROMPT SET 10: Salary Components
    // ============================================
    Route::apiResource('staff-benefits', StaffBenefitController::class);
    Route::apiResource('incentive-records', IncentiveRecordController::class);
    Route::apiResource('salary-advances', SalaryAdvanceController::class);
    Route::post('/salary-advances/{salaryAdvance}/payment', [SalaryAdvanceController::class, 'recordPayment']);
    Route::apiResource('recurring-deductions', RecurringDeductionController::class);

    // ============================================
    // PROMPT SET 11: Payroll Processing
    // ============================================
    Route::apiResource('bonus-payments', BonusPaymentController::class);
    Route::apiResource('extra-hours-records', ExtraHoursRecordController::class);
    Route::apiResource('employer-contributions', EmployerContributionController::class);

    // ============================================
    // PROMPT SET 12: Payslip Generation
    // ============================================
    Route::apiResource('salary-slips', SalarySlipController::class)->except(['store', 'update']);
    Route::post('/salary-slips/generate', [SalarySlipController::class, 'generate']);
    Route::post('/salary-slips/bulk-generate', [SalarySlipController::class, 'bulkGenerate']);
    Route::post('/salary-slips/{salarySlip}/mark-paid', [SalarySlipController::class, 'markPaid']);

    // ============================================
    // PROMPT SET 13: Tax Management
    // ============================================
    Route::apiResource('tax-slabs', TaxSlabController::class);
    Route::post('/tax-slabs/calculate', [TaxSlabController::class, 'calculate']);
    Route::apiResource('tax-exemptions', TaxExemptionController::class);
    Route::apiResource('minimum-tax-limits', MinimumTaxLimitController::class);

    // ============================================
    // PROMPT SET 14: Events & Calendar
    // ============================================
    Route::apiResource('company-events', CompanyEventController::class);
    Route::post('/company-events/{companyEvent}/rsvp', [CompanyEventController::class, 'rsvp']);
    Route::get('/calendar-data', [CompanyEventController::class, 'calendarData']);

    // ============================================
    // PROMPT SET 15: Company Policies & Documents
    // ============================================
    Route::apiResource('document-types', DocumentTypeController::class);
    Route::apiResource('organization-policies', OrganizationPolicyController::class);
    Route::post('/organization-policies/{organizationPolicy}/acknowledge', [OrganizationPolicyController::class, 'acknowledge']);
    Route::get('/policies-pending', [OrganizationPolicyController::class, 'pending']);
    Route::apiResource('organization-documents', OrganizationDocumentController::class);
    Route::get('/organization-documents/{organizationDocument}/download', [OrganizationDocumentController::class, 'download']);

    // ============================================
    // PROMPT SET 16: Letter Templates
    // ============================================
    Route::apiResource('letter-templates', LetterTemplateController::class);
    Route::get('/letter-placeholders', [LetterTemplateController::class, 'placeholders']);
    Route::apiResource('generated-letters', GeneratedLetterController::class)->except(['store', 'update']);
    Route::post('/generated-letters/generate', [GeneratedLetterController::class, 'generate']);
    Route::get('/generated-letters/{generatedLetter}/preview', [GeneratedLetterController::class, 'preview']);

    // ============================================
    // PROMPT SET 17: IP Restriction & Settings
    // ============================================
    Route::apiResource('allowed-ip-addresses', AllowedIpAddressController::class);
    Route::get('/check-ip', [AllowedIpAddressController::class, 'check']);
    Route::get('/system-configurations', [SystemConfigurationController::class, 'index']);
    Route::post('/system-configurations/get', [SystemConfigurationController::class, 'getValue']);
    Route::post('/system-configurations/set', [SystemConfigurationController::class, 'setValue']);
    Route::post('/system-configurations/bulk', [SystemConfigurationController::class, 'bulkUpdate']);
    Route::get('/system-configurations/category/{category}', [SystemConfigurationController::class, 'getByCategory']);
    Route::delete('/system-configurations/{systemConfiguration}', [SystemConfigurationController::class, 'destroy']);

    // ============================================
    // PROMPT SET 18: Reports & Dashboard
    // ============================================
    Route::prefix('reports')->group(function () {
        Route::get('/attendance', [ReportController::class, 'attendanceReport']);
        Route::get('/leave', [ReportController::class, 'leaveReport']);
        Route::get('/payroll', [ReportController::class, 'payrollReport']);
        Route::get('/headcount', [ReportController::class, 'headcountReport']);
    });
    Route::get('/dashboard', [ReportController::class, 'dashboard']);

    // ============================================
    // PROMPT SET 19: DataTables (Server-Side)
    // ============================================
    Route::prefix('datatables')->group(function () {
        Route::get('/staff-members', [DataTableController::class, 'staffMembers']);
        Route::get('/attendance', [DataTableController::class, 'attendance']);
        Route::get('/leave-requests', [DataTableController::class, 'leaveRequests']);
        Route::get('/payslips', [DataTableController::class, 'payslips']);
    });

    // ============================================
    // PROMPT SET 20: Import/Export
    // ============================================
    Route::prefix('imports')->group(function () {
        Route::get('/', [DataImportController::class, 'index']);
        Route::get('/template', [DataImportController::class, 'template']);
        Route::post('/staff-members', [DataImportController::class, 'importStaffMembers']);
        Route::post('/attendance', [DataImportController::class, 'importAttendance']);
        Route::post('/holidays', [DataImportController::class, 'importHolidays']);
        Route::get('/{dataImport}', [DataImportController::class, 'show']);
    });
    
    Route::prefix('exports')->group(function () {
        Route::get('/staff-members', [DataExportController::class, 'exportStaffMembers']);
        Route::get('/attendance', [DataExportController::class, 'exportAttendance']);
        Route::get('/leaves', [DataExportController::class, 'exportLeaves']);
        Route::get('/payroll', [DataExportController::class, 'exportPayroll']);
    });

    // ============================================
    // PROMPT SET 21: Performance Management
    // ============================================
    Route::apiResource('performance-objectives', PerformanceObjectiveController::class);
    Route::post('/performance-objectives/{performanceObjective}/progress', [PerformanceObjectiveController::class, 'updateProgress']);
    Route::post('/performance-objectives/{performanceObjective}/rate', [PerformanceObjectiveController::class, 'rate']);

    // ============================================
    // PROMPT SET 22: Appraisals
    // ============================================
    Route::apiResource('appraisal-cycles', AppraisalCycleController::class);
    Route::post('/appraisal-cycles/{appraisalCycle}/activate', [AppraisalCycleController::class, 'activate']);
    Route::post('/appraisal-cycles/{appraisalCycle}/close', [AppraisalCycleController::class, 'close']);
    Route::apiResource('appraisal-records', AppraisalRecordController::class)->except(['store', 'update', 'destroy']);
    Route::post('/appraisal-records/{appraisalRecord}/self-review', [AppraisalRecordController::class, 'submitSelfReview']);
    Route::post('/appraisal-records/{appraisalRecord}/manager-review', [AppraisalRecordController::class, 'submitManagerReview']);
    Route::get('/my-appraisals', [AppraisalRecordController::class, 'myAppraisals']);

    // ============================================
    // PROMPT SET 23: Asset Management
    // ============================================
    Route::apiResource('asset-types', AssetTypeController::class);
    Route::apiResource('assets', AssetController::class);
    Route::post('/assets/{asset}/assign', [AssetController::class, 'assign']);
    Route::post('/assets/{asset}/return', [AssetController::class, 'returnAsset']);
    Route::post('/assets/{asset}/maintenance', [AssetController::class, 'setMaintenance']);
    Route::get('/assets-available', [AssetController::class, 'available']);
    Route::get('/assets/employee/{staffMemberId}', [AssetController::class, 'byEmployee']);

    // ============================================
    // PROMPT SET 24: Training Management
    // ============================================
    Route::apiResource('training-types', TrainingTypeController::class);
    Route::apiResource('training-programs', TrainingProgramController::class);
    Route::apiResource('training-sessions', TrainingSessionController::class);
    Route::post('/training-sessions/{trainingSession}/enroll', [TrainingSessionController::class, 'enroll']);
    Route::post('/training-sessions/{trainingSession}/complete', [TrainingSessionController::class, 'complete']);
    Route::get('/training/employee/{staffMemberId}', [TrainingSessionController::class, 'employeeTraining']);

    // ============================================
    // PROMPT SET 25: Recruitment - Jobs
    // ============================================
    Route::apiResource('job-categories', JobCategoryController::class);
    Route::apiResource('job-stages', JobStageController::class);
    Route::post('/job-stages/reorder', [JobStageController::class, 'reorder']);
    Route::apiResource('jobs', JobController::class);
    Route::post('/jobs/{job}/publish', [JobController::class, 'publish']);
    Route::post('/jobs/{job}/close', [JobController::class, 'close']);
    Route::get('/jobs/{job}/questions', [JobController::class, 'questions']);
    Route::post('/jobs/{job}/questions', [JobController::class, 'addQuestion']);

    // ============================================
    // PROMPT SET 26: Recruitment - Candidates
    // ============================================
    Route::apiResource('candidates', CandidateController::class);
    Route::post('/candidates/{candidate}/archive', [CandidateController::class, 'archive']);
    Route::post('/candidates/{candidate}/convert-to-employee', [CandidateController::class, 'convertToEmployee']);

    // ============================================
    // PROMPT SET 27: Recruitment - Applications & Interviews
    // ============================================
    Route::get('/job-applications', [JobApplicationController::class, 'index']);
    Route::post('/jobs/{job}/applications', [JobApplicationController::class, 'store']);
    Route::get('/job-applications/{jobApplication}', [JobApplicationController::class, 'show']);
    Route::post('/job-applications/{jobApplication}/move-stage', [JobApplicationController::class, 'moveStage']);
    Route::post('/job-applications/{jobApplication}/rate', [JobApplicationController::class, 'rate']);
    Route::post('/job-applications/{jobApplication}/notes', [JobApplicationController::class, 'addNote']);
    Route::post('/job-applications/{jobApplication}/shortlist', [JobApplicationController::class, 'shortlist']);
    Route::post('/job-applications/{jobApplication}/reject', [JobApplicationController::class, 'reject']);
    Route::post('/job-applications/{jobApplication}/hire', [JobApplicationController::class, 'hire']);

    Route::apiResource('interview-schedules', InterviewScheduleController::class);
    Route::post('/interview-schedules/{interviewSchedule}/feedback', [InterviewScheduleController::class, 'feedback']);
    Route::post('/interview-schedules/{interviewSchedule}/reschedule', [InterviewScheduleController::class, 'reschedule']);
    Route::get('/interviews/calendar', [InterviewScheduleController::class, 'calendar']);
    Route::get('/interviews/today', [InterviewScheduleController::class, 'today']);

    // ============================================
    // PROMPT SET 28: Onboarding
    // ============================================
    Route::apiResource('onboarding-templates', OnboardingTemplateController::class);
    Route::post('/onboarding-templates/{onboardingTemplate}/tasks', [OnboardingTemplateController::class, 'addTask']);
    Route::apiResource('employee-onboardings', EmployeeOnboardingController::class)->except(['update', 'destroy']);
    Route::post('/employee-onboardings/{employeeOnboarding}/complete-task', [EmployeeOnboardingController::class, 'completeTask']);
    Route::get('/onboardings/pending', [EmployeeOnboardingController::class, 'pending']);

    // ============================================
    // PROMPT SET 29: Contract Management
    // ============================================
    Route::apiResource('contract-types', ContractTypeController::class);
    Route::apiResource('contracts', ContractController::class);
    Route::post('/contracts/{contract}/renew', [ContractController::class, 'renew']);
    Route::post('/contracts/{contract}/terminate', [ContractController::class, 'terminate']);
    Route::get('/contracts-expiring', [ContractController::class, 'expiring']);
    Route::get('/contracts/employee/{staffMemberId}', [ContractController::class, 'byEmployee']);

    // ============================================
    // PROMPT SET 30: Meeting Management
    // ============================================
    Route::apiResource('meeting-types', MeetingTypeController::class);
    Route::apiResource('meeting-rooms', MeetingRoomController::class);
    Route::get('/meeting-rooms-available', [MeetingRoomController::class, 'available']);
    Route::apiResource('meetings', MeetingController::class);
    Route::post('/meetings/{meeting}/attendees', [MeetingController::class, 'addAttendees']);
    Route::post('/meetings/{meeting}/start', [MeetingController::class, 'start']);
    Route::post('/meetings/{meeting}/complete', [MeetingController::class, 'complete']);
    Route::post('/meetings/{meeting}/minutes', [MeetingController::class, 'addMinutes']);
    Route::post('/meetings/{meeting}/action-items', [MeetingController::class, 'addActionItem']);
    Route::post('/meeting-action-items/{meetingActionItem}/complete', [MeetingController::class, 'completeActionItem']);
    Route::get('/meetings-calendar', [MeetingController::class, 'calendar']);
    Route::get('/my-meetings', [MeetingController::class, 'myMeetings']);

    // ============================================
    // PROMPT SET 31: Shifts Management
    // ============================================
    Route::apiResource('shifts', ShiftController::class);
    Route::post('/shifts/{shift}/assign', [ShiftController::class, 'assign']);
    Route::get('/shift-roster', [ShiftController::class, 'roster']);
    Route::get('/shifts/employee/{staffMemberId}', [ShiftController::class, 'employeeShifts']);

    // ============================================
    // PROMPT SET 32: Timesheets
    // ============================================
    Route::apiResource('timesheet-projects', TimesheetProjectController::class);
    Route::apiResource('timesheets', TimesheetController::class);
    Route::post('/timesheets/bulk', [TimesheetController::class, 'bulkStore']);
    Route::post('/timesheets/{timesheet}/submit', [TimesheetController::class, 'submit']);
    Route::post('/timesheets/{timesheet}/approve', [TimesheetController::class, 'approve']);
    Route::post('/timesheets/{timesheet}/reject', [TimesheetController::class, 'reject']);
    Route::get('/timesheet-summary', [TimesheetController::class, 'summary']);
    Route::get('/timesheets/employee/{staffMemberId}', [TimesheetController::class, 'employeeTimesheets']);
    Route::get('/timesheet-report', [TimesheetController::class, 'report']);

    // ============================================
    // DOCUMENT MANAGEMENT (100% Coverage)
    // ============================================
    Route::apiResource('document-categories', DocumentCategoryController::class);
    Route::apiResource('hr-documents', HrDocumentController::class);
    Route::get('/hr-documents/{hrDocument}/download', [HrDocumentController::class, 'download']);
    Route::post('/hr-documents/{hrDocument}/acknowledge', [HrDocumentController::class, 'acknowledge']);
    Route::get('/hr-documents/{hrDocument}/acknowledgments', [HrDocumentController::class, 'acknowledgments']);
    Route::get('/pending-acknowledgments', [HrDocumentController::class, 'pendingAcknowledgments']);

    // ============================================
    // MEDIA LIBRARY (100% Coverage)
    // ============================================
    Route::apiResource('media-directories', MediaDirectoryController::class);
    Route::post('/media-directories/{mediaDirectory}/move', [MediaDirectoryController::class, 'move']);
    Route::apiResource('media-files', MediaFileController::class);
    Route::get('/media-files/{mediaFile}/download', [MediaFileController::class, 'download']);
    Route::post('/media-files/{mediaFile}/move', [MediaFileController::class, 'move']);
    Route::post('/media-files/{mediaFile}/share', [MediaFileController::class, 'share']);
    Route::post('/media-files/{mediaFile}/unshare', [MediaFileController::class, 'unshare']);

    // ============================================
    // JOB REQUISITIONS (100% Coverage)
    // ============================================
    Route::apiResource('job-requisitions', JobRequisitionController::class);
    Route::post('/job-requisitions/{jobRequisition}/approve', [JobRequisitionController::class, 'approve']);
    Route::post('/job-requisitions/{jobRequisition}/reject', [JobRequisitionController::class, 'reject']);
    Route::get('/job-requisitions-pending', [JobRequisitionController::class, 'pending']);

    // ============================================
    // OFFER MANAGEMENT (100% Coverage)
    // ============================================
    Route::apiResource('offer-templates', OfferTemplateController::class);
    Route::get('/offer-template-variables', [OfferTemplateController::class, 'variables']);
    Route::apiResource('offers', OfferController::class);
    Route::post('/offers/{offer}/send', [OfferController::class, 'send']);
    Route::post('/offers/{offer}/accept', [OfferController::class, 'accept']);
    Route::post('/offers/{offer}/reject', [OfferController::class, 'reject']);
    Route::post('/offers/{offer}/withdraw', [OfferController::class, 'withdraw']);
    Route::get('/offers-pending', [OfferController::class, 'pending']);
    Route::get('/offers-expired', [OfferController::class, 'expired']);

    // ============================================
    // CANDIDATE ASSESSMENTS (100% Coverage)
    // ============================================
    Route::apiResource('candidate-assessments', CandidateAssessmentController::class);
    Route::post('/candidate-assessments/{candidateAssessment}/complete', [CandidateAssessmentController::class, 'complete']);
    Route::post('/candidate-assessments/{candidateAssessment}/cancel', [CandidateAssessmentController::class, 'cancel']);
    Route::get('/candidates/{candidateId}/assessments', [CandidateAssessmentController::class, 'candidateAssessments']);

    // ============================================
    // ATTENDANCE REGULARIZATION (100% Coverage)
    // ============================================
    Route::apiResource('attendance-regularizations', AttendanceRegularizationController::class)->only(['index', 'store', 'show']);
    Route::post('/attendance-regularizations/{attendanceRegularization}/approve', [AttendanceRegularizationController::class, 'approve']);
    Route::post('/attendance-regularizations/{attendanceRegularization}/reject', [AttendanceRegularizationController::class, 'reject']);
    Route::get('/attendance-regularizations-pending', [AttendanceRegularizationController::class, 'pending']);
    Route::get('/my-regularization-requests', [AttendanceRegularizationController::class, 'myRequests']);
});

