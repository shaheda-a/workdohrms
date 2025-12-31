import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/sign-in', { email, password }),
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/sign-up', data),
  logout: () => api.post('/auth/sign-out'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
  getEmployeeStats: () => api.get('/dashboard/employee-stats'),
  getAttendanceStats: () => api.get('/dashboard/attendance-stats'),
  getLeaveStats: () => api.get('/dashboard/leave-stats'),
};

export const staffService = {
  getAll: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get('/staff-members', { params }),
  getById: (id: number) => api.get(`/staff-members/${id}`),
  create: (data: Record<string, unknown>) => api.post('/staff-members', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/staff-members/${id}`, data),
  delete: (id: number) => api.delete(`/staff-members/${id}`),
  getFiles: (id: number) => api.get(`/staff-members/${id}/files`),
  uploadFile: (id: number, data: FormData) =>
    api.post(`/staff-members/${id}/files`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteFile: (id: number, fileId: number) => api.delete(`/staff-members/${id}/files/${fileId}`),
  getFileCategories: () => api.get('/file-categories', { params: { paginate: false } }),
};

export const attendanceService = {
  clockIn: () => api.post('/clock-in'),
  clockOut: () => api.post('/clock-out'),
  getWorkLogs: (params?: { staff_member_id?: number; start_date?: string; end_date?: string; page?: number }) =>
    api.get('/work-logs', { params }),
  getSummary: (params: { staff_member_id: number; start_date: string; end_date: string }) =>
    api.get('/attendance-summary', { params }),
  getShifts: () => api.get('/shifts'),
  createShift: (data: Record<string, unknown>) => api.post('/shifts', data),
  updateShift: (id: number, data: Record<string, unknown>) => api.put(`/shifts/${id}`, data),
  deleteShift: (id: number) => api.delete(`/shifts/${id}`),
};

export const leaveService = {
  getCategories: () => api.get('/time-off-categories'),
  createCategory: (data: Record<string, unknown>) => api.post('/time-off-categories', data),
  updateCategory: (id: number, data: Record<string, unknown>) => api.put(`/time-off-categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/time-off-categories/${id}`),
  getRequests: (params?: { status?: string; page?: number }) => api.get('/time-off-requests', { params }),
  createRequest: (data: Record<string, unknown>) => api.post('/time-off-requests', data),
  processRequest: (id: number, data: { action: 'approve' | 'decline'; remarks?: string }) =>
    api.post(`/time-off-requests/${id}/process`, data),
  getBalances: (staffMemberId: number) => api.get(`/staff-members/${staffMemberId}/leave-balances`),
};

export const payrollService = {
  getSalarySlips: (params?: { staff_member_id?: number; salary_period?: string; page?: number }) =>
    api.get('/salary-slips', { params }),
  generateSlip: (data: { staff_member_id: number; salary_period: string }) =>
    api.post('/salary-slips/generate', data),
  bulkGenerate: (data: { employee_ids: number[]; month: number; year: number }) =>
    api.post('/salary-slips/bulk-generate', data),
  getSlipById: (id: number) => api.get(`/salary-slips/${id}`),
  downloadSlip: (id: number) => api.get(`/salary-slips/${id}/download`, { responseType: 'blob' }),
// Updated benefits methods for top-level routes
getBenefits: (params?: { staff_member_id?: number; benefit_type_id?: number; active?: boolean; paginate?: boolean; page?: number; per_page?: number }) => 
    api.get('/staff-benefits', { params }),
  createBenefit: (data: { staff_member_id: number; benefit_type_id: number; amount: number; description?: string; calculation_type?: string; effective_until?: string; effective_from?: string; is_active?: boolean }) =>
    api.post('/staff-benefits', data),
   updateBenefit: (id: number, data: Partial<{ 
    benefit_type_id: number; 
    description: string; 
    calculation_type: 'fixed' | 'percentage'; 
    amount: number; 
    effective_from?: string | null; 
    effective_until?: string | null; 
    is_active?: boolean 
  }>) => api.put(`/staff-benefits/${id}`, data),
  deleteBenefit: (id: number) => api.delete(`/staff-benefits/${id}`),
  
  // Benefit Types CRUD methods
  getBenefitTypes: (params?: { 
    active?: boolean; 
    taxable?: boolean; 
    paginate?: boolean; 
    page?: number; 
    per_page?: number 
  }) => api.get('/benefit-types', { params }),
  
  createBenefitType: (data: { 
    title: string; 
    notes?: string; 
    is_taxable?: boolean; 
    is_active?: boolean 
  }) => api.post('/benefit-types', data),
  
  updateBenefitType: (id: number, data: Partial<{ 
    title: string; 
    notes?: string; 
    is_taxable?: boolean; 
    is_active?: boolean 
  }>) => api.put(`/benefit-types/${id}`, data),
  
  deleteBenefitType: (id: number) => api.delete(`/benefit-types/${id}`),
  
  // Similarly for deductions (if you have staff-deductions route)
 getDeductions: (params?: { 
    staff_member_id?: number; 
    withholding_type_id?: number; 
    active?: boolean; 
    paginate?: boolean; 
    page?: number; 
    per_page?: number 
  }) => api.get('/recurring-deductions', { params }),
  
  createDeduction: (data: { 
    staff_member_id: number; 
    withholding_type_id: number; 
    description: string; 
    calculation_type: 'fixed' | 'percentage'; 
    amount: number; 
    effective_from?: string; 
    effective_until?: string; 
    is_active?: boolean 
  }) => api.post('/recurring-deductions', data),
  
  updateDeduction: (id: number, data: Partial<{ 
    withholding_type_id: number; 
    description: string; 
    calculation_type: 'fixed' | 'percentage'; 
    amount: number; 
    effective_from?: string; 
    effective_until?: string; 
    is_active?: boolean 
  }>) => api.put(`/recurring-deductions/${id}`, data),
  
  deleteDeduction: (id: number) => api.delete(`/recurring-deductions/${id}`),
  
  // Withholding Types CRUD methods
  getWithholdingTypes: (params?: { 
    active?: boolean; 
    statutory?: boolean; 
    paginate?: boolean; 
    page?: number; 
    per_page?: number 
  }) => api.get('/withholding-types', { params }),
  
  createWithholdingType: (data: { 
    title: string; 
    notes?: string; 
    is_statutory?: boolean; 
    is_active?: boolean 
  }) => api.post('/withholding-types', data),
  
  updateWithholdingType: (id: number, data: Partial<{ 
    title: string; 
    notes?: string; 
    is_statutory?: boolean; 
    is_active?: boolean 
  }>) => api.put(`/withholding-types/${id}`, data),
  
  deleteWithholdingType: (id: number) => api.delete(`/withholding-types/${id}`),
  
 getTaxSlabs: () => api.get('/tax-slabs'),
calculateTax: (data: Record<string, unknown>) => api.post('/tax-slabs/calculate', data), // Remove 'annual_income' type restriction
createTaxSlab: (data: Record<string, unknown>) => api.post('/tax-slabs', data),
updateTaxSlab: (id: number, data: Record<string, unknown>) => api.put(`/tax-slabs/${id}`, data),
deleteTaxSlab: (id: number) => api.delete(`/tax-slabs/${id}`),
getTaxSlab: (id: number) => api.get(`/tax-slabs/${id}`),
};

export const recruitmentService = {
    getOfficeLocations: () => api.get('/office-locations'),
  getDivisions: () => api.get('/divisions'),
    getJobs: (params?: { 
    status?: string; 
    page?: number;
    per_page?: number;
    search?: string;
    job_category_id?: number;
    office_location_id?: number;
  }) => api.get('/jobs', { params }),
  createJob: (data: Record<string, unknown>) => api.post('/jobs', data),
  getJobById: (id: number) => api.get(`/jobs/${id}`),
  updateJob: (id: number, data: Record<string, unknown>) => api.put(`/jobs/${id}`, data),
  deleteJob: (id: number) => api.delete(`/jobs/${id}`),
  publishJob: (id: number) => api.post(`/jobs/${id}/publish`),
  closeJob: (id: number) => api.post(`/jobs/${id}/close`),
   getJobCategories: (params?: { 
    search?: string;
    paginate?: boolean; 
    page?: number; 
    per_page?: number 
  }) => api.get('/job-categories', { params }),
  
  createJobCategory: (data: { 
    title: string; 
    description?: string; 
  }) => api.post('/job-categories', data),
  
  updateJobCategory: (id: number, data: Partial<{ 
    title: string; 
    description?: string; 
  }>) => api.put(`/job-categories/${id}`, data),
  
  deleteJobCategory: (id: number) => api.delete(`/job-categories/${id}`),
  getCandidates: (params?: { job_id?: number; page?: number }) => api.get('/candidates', { params }),
  getCandidate: (id: number) => api.get(`/candidates/${id}`),
  createCandidate: (data: Record<string, unknown>) => api.post('/candidates', data),
  updateCandidate: (id: number, data: Record<string, unknown>) => api.put(`/candidates/${id}`, data),
  deleteCandidate: (id: number) => api.delete(`/candidates/${id}`),
  getApplications: (params?: { job_id?: number; status?: string; page?: number }) =>
    api.get('/job-applications', { params }),
  updateApplicationStatus: (id: number, data: { status: string }) =>
    api.put(`/job-applications/${id}/status`, data),
  getInterviews: (params?: { page?: number }) => api.get('/interview-schedules', { params }),
  scheduleInterview: (data: Record<string, unknown>) => api.post('/interview-schedules', data),
  submitFeedback: (id: number, data: Record<string, unknown>) =>
    api.post(`/interview-schedules/${id}/feedback`, data),
};

export const performanceService = {
  getGoals: (params?: { staff_member_id?: number; page?: number }) => api.get('/performance-objectives', { params }),
  createGoal: (data: Record<string, unknown>) => api.post('/performance-objectives', data),
  updateGoal: (id: number, data: Record<string, unknown>) => api.put(`/performance-objectives/${id}`, data),
  deleteGoal: (id: number) => api.delete(`/performance-objectives/${id}`),
  updateProgress: (id: number, data: Record<string, unknown>) => api.post(`/performance-objectives/${id}/progress`, data),
  rateGoal: (id: number, data: Record<string, unknown>) => api.post(`/performance-objectives/${id}/rate`, data),
  getAppraisals: (params?: { staff_member_id?: number; page?: number }) => api.get('/appraisal-records', { params }),
  getAppraisalCycles: () => api.get('/appraisal-cycles'),
  createAppraisalCycle: (data: Record<string, unknown>) => api.post('/appraisal-cycles', data),
  submitSelfReview: (id: number, data: Record<string, unknown>) => api.post(`/appraisal-records/${id}/self-review`, data),
  submitManagerReview: (id: number, data: Record<string, unknown>) => api.post(`/appraisal-records/${id}/manager-review`, data),
};

export const assetService = {
  getAll: (params?: { type_id?: number; status?: string; page?: number; search?: string }) => api.get('/assets', { params }),
  getAssetTypes: () => api.get('/asset-types'),
  createAssetType: (data: Record<string, unknown>) => api.post('/asset-types', data),
  getAssets: (params?: { type_id?: number; status?: string; page?: number }) => api.get('/assets', { params }),
  create: (data: Record<string, unknown>) => api.post('/assets', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/assets/${id}`, data),
  delete: (id: number) => api.delete(`/assets/${id}`),
  getAvailable: () => api.get('/assets-available'),
  getByEmployee: (staffMemberId: number) => api.get(`/assets/employee/${staffMemberId}`),
  assignAsset: (assetId: number, data: Record<string, unknown>) => api.post(`/assets/${assetId}/assign`, data),
  returnAsset: (assetId: number) => api.post(`/assets/${assetId}/return`),
  setMaintenance: (assetId: number, data: Record<string, unknown>) => api.post(`/assets/${assetId}/maintenance`, data),
};

export const trainingService = {
  getTypes: () => api.get('/training-types'),
  createType: (data: Record<string, unknown>) => api.post('/training-types', data),
  getPrograms: (params?: { page?: number }) => api.get('/training-programs', { params }),
  createProgram: (data: Record<string, unknown>) => api.post('/training-programs', data),
  updateProgram: (id: number, data: Record<string, unknown>) => api.put(`/training-programs/${id}`, data),
  deleteProgram: (id: number) => api.delete(`/training-programs/${id}`),
  getSessions: (params?: { page?: number }) => api.get('/training-sessions', { params }),
  createSession: (data: Record<string, unknown>) => api.post('/training-sessions', data),
  enrollInSession: (sessionId: number, data: Record<string, unknown>) => api.post(`/training-sessions/${sessionId}/enroll`, data),
  completeSession: (sessionId: number, data: Record<string, unknown>) => api.post(`/training-sessions/${sessionId}/complete`, data),
  getEmployeeTraining: (staffMemberId: number) => api.get(`/training/employee/${staffMemberId}`),
};

export const contractService = {
  getAll: (params?: { staff_member_id?: number; status?: string; page?: number }) =>
    api.get('/contracts', { params }),
  getContracts: (params?: { staff_member_id?: number; status?: string; page?: number }) =>
    api.get('/contracts', { params }),
  createContract: (data: Record<string, unknown>) => api.post('/contracts', data),
  updateContract: (id: number, data: Record<string, unknown>) => api.put(`/contracts/${id}`, data),
  deleteContract: (id: number) => api.delete(`/contracts/${id}`),
  renewContract: (id: number, data: Record<string, unknown>) => api.post(`/contracts/${id}/renew`, data),
  terminateContract: (id: number, data: Record<string, unknown>) => api.post(`/contracts/${id}/terminate`, data),
};

export const meetingService = {
  getTypes: () => api.get('/meeting-types'),
  createType: (data: Record<string, unknown>) => api.post('/meeting-types', data),
  getRooms: () => api.get('/meeting-rooms'),
  getAvailableRooms: () => api.get('/meeting-rooms-available'),
  getAll: (params?: { page?: number }) => api.get('/meetings', { params }),
  getMeetings: (params?: { page?: number }) => api.get('/meetings', { params }),
  createMeeting: (data: Record<string, unknown>) => api.post('/meetings', data),
  updateMeeting: (id: number, data: Record<string, unknown>) => api.put(`/meetings/${id}`, data),
  deleteMeeting: (id: number) => api.delete(`/meetings/${id}`),
  addAttendees: (meetingId: number, data: Record<string, unknown>) => api.post(`/meetings/${meetingId}/attendees`, data),
  startMeeting: (meetingId: number) => api.post(`/meetings/${meetingId}/start`),
  completeMeeting: (meetingId: number) => api.post(`/meetings/${meetingId}/complete`),
  addMinutes: (meetingId: number, data: Record<string, unknown>) => api.post(`/meetings/${meetingId}/minutes`, data),
  addActionItem: (meetingId: number, data: Record<string, unknown>) => api.post(`/meetings/${meetingId}/action-items`, data),
  getCalendar: () => api.get('/meetings-calendar'),
  getMyMeetings: () => api.get('/my-meetings'),
};

export const reportService = {
  getAttendanceReport: (params: { start_date: string; end_date: string; staff_member_id?: number; type?: string }) =>
    api.get('/reports/attendance', { params }),
  getLeaveReport: (params: { start_date: string; end_date: string; staff_member_id?: number }) =>
    api.get('/reports/leave', { params }),
  getPayrollReport: (params: { salary_period: string }) =>
    api.get('/reports/payroll', { params }),
  getHeadcountReport: () => api.get('/reports/headcount'),
  getTurnoverReport: (params: { year: number }) => api.get('/reports/turnover', { params }),
  exportAttendanceReport: (params: { start_date: string; end_date: string; type?: string; format: string }) =>
    api.get('/reports/attendance/export', { params, responseType: 'blob' }),
  exportLeaveReport: (params: { start_date: string; end_date: string; format: string }) =>
    api.get('/reports/leave/export', { params, responseType: 'blob' }),
  exportPayrollReport: (params: { salary_period: string; format: string }) =>
    api.get('/reports/payroll/export', { params, responseType: 'blob' }),
};

export const settingsService = {
  // getOfficeLocations: () => api.get('/office-locations'),
  createOfficeLocation: (data: Record<string, unknown>) => api.post('/office-locations', data),
  updateOfficeLocation: (id: number, data: Record<string, unknown>) => api.put(`/office-locations/${id}`, data),
  deleteOfficeLocation: (id: number) => api.delete(`/office-locations/${id}`),
  // getDivisions: () => api.get('/divisions'),
  createDivision: (data: Record<string, unknown>) => api.post('/divisions', data),
  updateDivision: (id: number, data: Record<string, unknown>) => api.put(`/divisions/${id}`, data),
  deleteDivision: (id: number) => api.delete(`/divisions/${id}`),
  getJobTitles: () => api.get('/job-titles'),
  createJobTitle: (data: Record<string, unknown>) => api.post('/job-titles', data),
  updateJobTitle: (id: number, data: Record<string, unknown>) => api.put(`/job-titles/${id}`, data),
  deleteJobTitle: (id: number) => api.delete(`/job-titles/${id}`),
  getHolidays: () => api.get('/company-holidays'),
  createHoliday: (data: Record<string, unknown>) => api.post('/company-holidays', data),
  updateHoliday: (id: number, data: Record<string, unknown>) => api.put(`/company-holidays/${id}`, data),
  deleteHoliday: (id: number) => api.delete(`/company-holidays/${id}`),
  getNotices: () => api.get('/company-notices'),
  createNotice: (data: Record<string, unknown>) => api.post('/company-notices', data),
  getFileCategories: () => api.get('/file-categories', { params: { paginate: false } }),
  createFileCategory: (data: Record<string, unknown>) => api.post('/file-categories', data),
  updateFileCategory: (id: number, data: Record<string, unknown>) => api.put(`/file-categories/${id}`, data),
  deleteFileCategory: (id: number) => api.delete(`/file-categories/${id}`),
};

export const adminService = {
  getUsers: (params?: { page?: number; per_page?: number; search?: string; role?: string }) => api.get('/users', { params }),
  getUser: (id: number) => api.get(`/users/${id}`),
  createUser: (data: Record<string, unknown>) => api.post('/users', data),
  updateUser: (id: number, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  getUserRoles: (id: number) => api.get(`/users/${id}/roles`),
  assignUserRoles: (id: number, data: { roles: string[] }) => api.post(`/users/${id}/roles`, data),
  addUserRole: (id: number, data: { role: string }) => api.post(`/users/${id}/roles/add`, data),
  removeUserRole: (id: number, data: { role: string }) => api.post(`/users/${id}/roles/remove`, data),
};

export const roleService = {
  getAll: (params?: { search?: string }) => api.get('/roles', { params }),
  getById: (id: number) => api.get(`/roles/${id}`),
  create: (data: Record<string, unknown>) => api.post('/roles', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
  getPermissions: (id: number) => api.get(`/roles/${id}/permissions`),
  syncPermissions: (id: number, data: { permissions: string[] }) => api.post(`/roles/${id}/permissions`, data),
};

export const permissionService = {
  getAll: (params?: { search?: string; resource?: string }) => api.get('/permissions', { params }),
  getGrouped: () => api.get('/permissions/grouped'),
  getById: (id: number) => api.get(`/permissions/${id}`),
};

export const resourceService = {
  getAll: (params?: { search?: string }) => api.get('/resources', { params }),
  getById: (id: number) => api.get(`/resources/${id}`),
  getBySlug: (slug: string) => api.get(`/resources/slug/${slug}`),
};

export const organizationService = {
  getAll: (params?: { page?: number; search?: string }) => api.get('/organizations', { params }),
  getById: (id: number) => api.get(`/organizations/${id}`),
  create: (data: Record<string, unknown>) => api.post('/organizations', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/organizations/${id}`, data),
  delete: (id: number) => api.delete(`/organizations/${id}`),
};

export const companyService = {
  getAll: (params?: { page?: number; search?: string }) => api.get('/companies', { params }),
  getById: (id: number) => api.get(`/companies/${id}`),
  create: (data: Record<string, unknown>) => api.post('/companies', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/companies/${id}`, data),
  delete: (id: number) => api.delete(`/companies/${id}`),
};

export const assetTypeService = {
  getAll: (params?: { page?: number; search?: string }) => api.get('/asset-types', { params }),
  getById: (id: number) => api.get(`/asset-types/${id}`),
  create: (data: Record<string, unknown>) => api.post('/asset-types', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/asset-types/${id}`, data),
  delete: (id: number) => api.delete(`/asset-types/${id}`),
};

export const documentTypeService = {
  getAll: (params?: { page?: number; search?: string }) => api.get('/document-types', { params }),
  getById: (id: number) => api.get(`/document-types/${id}`),
  create: (data: Record<string, unknown>) => api.post('/document-types', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/document-types/${id}`, data),
  delete: (id: number) => api.delete(`/document-types/${id}`),
};

export const documentLocationService = {
  getAll: (params?: { page?: number; search?: string }) => api.get('/document-locations', { params }),
  getById: (id: number) => api.get(`/document-locations/${id}`),
  create: (data: Record<string, unknown>) => api.post('/document-locations', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/document-locations/${id}`, data),
  delete: (id: number) => api.delete(`/document-locations/${id}`),
};

export const documentConfigService = {
  createLocal: (data: Record<string, unknown>) => api.post('/document-configs/local', data),
  updateLocal: (id: number, data: Record<string, unknown>) => api.put(`/document-configs/local/${id}`, data),
  createWasabi: (data: Record<string, unknown>) => api.post('/document-configs/wasabi', data),
  updateWasabi: (id: number, data: Record<string, unknown>) => api.put(`/document-configs/wasabi/${id}`, data),
  createAws: (data: Record<string, unknown>) => api.post('/document-configs/aws', data),
  updateAws: (id: number, data: Record<string, unknown>) => api.put(`/document-configs/aws/${id}`, data),
  getConfig: (locationId: number) => api.get(`/document-configs/${locationId}`),
};
