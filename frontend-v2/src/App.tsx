import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import { Toaster } from './components/ui/toaster';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Staff Management
import StaffList from './pages/staff/StaffList';
import StaffCreate from './pages/staff/StaffCreate';
import StaffProfile from './pages/staff/StaffProfile';
import StaffEdit from './pages/staff/StaffEdit';


// Organization
import OrganizationList from './pages/organization/OrganizationList';
import CompanyList from './pages/company/CompanyList';

// Assets
import AssetTypeList from './pages/assets/AssetTypeList';

// Documents
import DocumentTypeList from './pages/documents/DocumentTypeList';
import DocumentLocationList from './pages/documents/DocumentLocationList';

// Attendance
import ClockInOut from './pages/attendance/ClockInOut';
import WorkLogs from './pages/attendance/WorkLogs';
import AttendanceSummary from './pages/attendance/AttendanceSummary';
import Shifts from './pages/attendance/Shifts';

// Leave Management
import LeaveRequests from './pages/leave/LeaveRequests';
import LeaveApply from './pages/leave/LeaveApply';
import LeaveApprovals from './pages/leave/LeaveApprovals';
import LeaveBalances from './pages/leave/LeaveBalances';
import LeaveCategories from './pages/leave/LeaveCategories';

// Payroll
import SalarySlips from './pages/payroll/SalarySlips';
import GeneratePayroll from './pages/payroll/GeneratePayroll';
import Benefits from './pages/payroll/Benefits';
import Deductions from './pages/payroll/Deductions';
import TaxSlabs from './pages/payroll/TaxSlabs';

// Recruitment
import Jobs from './pages/recruitment/Jobs';
import Candidates from './pages/recruitment/Candidates';
import Interviews from './pages/recruitment/Interviews';

// Performance
import Goals from './pages/performance/Goals';
import Appraisals from './pages/performance/Appraisals';

// Assets
import AssetsList from './pages/assets/AssetsList';

// Training
import Programs from './pages/training/Programs';

// Contracts
import Contracts from './pages/contracts/Contracts';

// Meetings
import Meetings from './pages/meetings/Meetings';

// Reports
import AttendanceReport from './pages/reports/AttendanceReport';
import LeaveReport from './pages/reports/LeaveReport';
import PayrollReport from './pages/reports/PayrollReport';

// Settings
import OfficeLocations from './pages/settings/OfficeLocations';
import Divisions from './pages/settings/Divisions';
import JobTitles from './pages/settings/JobTitles';
import Holidays from './pages/settings/Holidays';
import FileCategories from './pages/settings/FileCategories';
import DocumentConfiguration from './pages/settings/DocumentConfiguration';

// Admin
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import RolePermissions from './pages/admin/RolePermissions';
import Permissions from './pages/admin/Permissions';
import BenefitTypes from './pages/payroll/BenefitTypes';
import WithholdingTypes from './pages/payroll/WithHoldingType';
import JobCategories from './pages/recruitment/JobCategory';
import JobStages from './pages/recruitment/JobStages';
import JobApplications from './pages/recruitment/JobApplications';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Routes>
          {/* Public Routes - Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Staff Management */}
            <Route path="/staff" element={<StaffList />} />
            <Route path="/staff/create" element={<StaffCreate />} />
            <Route path="/staff/departments" element={<Divisions />} />
            <Route path="/staff/:id" element={<StaffProfile />} />
            <Route path="/staff/:id/edit" element={<StaffEdit />} />

            {/* Organization */}
            <Route path="/organizations" element={<OrganizationList />} />
            <Route path="/companies" element={<CompanyList />} />

            {/* Assets */}
            <Route path="/assets/types" element={<AssetTypeList />} />

            {/* Documents */}
            <Route path="/documents/types" element={<DocumentTypeList />} />
            <Route path="/documents/locations" element={<DocumentLocationList />} />

            {/* Attendance */}
            <Route path="/attendance" element={<ClockInOut />} />
            <Route path="/attendance/clock" element={<ClockInOut />} />
            <Route path="/attendance/logs" element={<WorkLogs />} />
            <Route path="/attendance/summary" element={<AttendanceSummary />} />
            <Route path="/attendance/shifts" element={<Shifts />} />

            {/* Leave Management */}
            <Route path="/leave" element={<LeaveRequests />} />
            <Route path="/leave/requests" element={<LeaveRequests />} />
            <Route path="/leave/apply" element={<LeaveApply />} />
            <Route path="/leave/approvals" element={<LeaveApprovals />} />
            <Route path="/leave/balances" element={<LeaveBalances />} />
            <Route path="/leave/categories" element={<LeaveCategories />} />

            {/* Payroll */}
            <Route path="/payroll" element={<SalarySlips />} />
            <Route path="/payroll/slips" element={<SalarySlips />} />
            <Route path="/payroll/generate" element={<GeneratePayroll />} />
            <Route path="/payroll/benefits" element={<Benefits />} />
            <Route path="/payroll/benefits/types" element={<BenefitTypes />} />
            <Route path="/payroll/deductions" element={<Deductions />} />
            <Route path="/payroll/deductions/types" element={<WithholdingTypes />} />
            <Route path="/payroll/tax" element={<TaxSlabs />} />

            {/* Recruitment */}
            <Route path="/recruitment/job/categories" element={<JobCategories />} />
            <Route path="/recruitment" element={<Jobs />} />
            <Route path="/recruitment/jobs" element={<Jobs />} />
            <Route path="/recruitment/candidates" element={<Candidates />} />
            <Route path="/recruitment/interviews" element={<Interviews />} />
            <Route path="/recruitment/job/stages" element={<JobStages />} />
            <Route path="/recruitment/applications" element={<JobApplications />} />

            {/* Performance */}
            <Route path="/performance" element={<Goals />} />
            <Route path="/performance/goals" element={<Goals />} />
            <Route path="/performance/appraisals" element={<Appraisals />} />

            {/* Assets */}
            <Route path="/assets" element={<AssetsList />} />

            {/* Training */}
            <Route path="/training" element={<Programs />} />
            <Route path="/training/programs" element={<Programs />} />

            {/* Contracts */}
            <Route path="/contracts" element={<Contracts />} />

            {/* Meetings */}
            <Route path="/meetings" element={<Meetings />} />

            {/* Reports */}
            <Route path="/reports" element={<AttendanceReport />} />
            <Route path="/reports/attendance" element={<AttendanceReport />} />
            <Route path="/reports/leave" element={<LeaveReport />} />
            <Route path="/reports/payroll" element={<PayrollReport />} />

            {/* Settings */}
            <Route path="/settings" element={<OfficeLocations />} />
            <Route path="/settings/locations" element={<OfficeLocations />} />
            <Route path="/settings/divisions" element={<Divisions />} />
            <Route path="/settings/job-titles" element={<JobTitles />} />
            <Route path="/settings/holidays" element={<Holidays />} />
            <Route path="/settings/file-categories" element={<FileCategories />} />
            <Route path="/settings/document-config" element={<DocumentConfiguration />} />

            {/* Admin */}
            <Route path="/admin" element={<Users />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/roles" element={<Roles />} />
            <Route path="/admin/roles/:id/permissions" element={<RolePermissions />} />
            <Route path="/admin/permissions" element={<Permissions />} />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
