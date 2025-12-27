import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi, settingsApi } from '../../api';
import { OfficeLocation, Division, JobTitle } from '../../types';
import { StaffCreateData } from '../../api/staff';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react';

export default function StaffCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [filteredDivisions, setFilteredDivisions] = useState<Division[]>([]);
  const [filteredJobTitles, setFilteredJobTitles] = useState<JobTitle[]>([]);

  const [formData, setFormData] = useState<StaffCreateData>({
    full_name: '',
    email: '',
    password: '',
    personal_email: '',
    mobile_number: '',
    birth_date: '',
    gender: undefined,
    home_address: '',
    nationality: '',
    office_location_id: undefined,
    division_id: undefined,
    job_title_id: undefined,
    hire_date: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
    bank_branch: '',
    compensation_type: undefined,
    base_salary: undefined,
    employment_type: undefined,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, divRes, jobRes] = await Promise.all([
          settingsApi.getOfficeLocations(),
          settingsApi.getDivisions(),
          settingsApi.getJobTitles(),
        ]);
        if (locRes.success) setLocations(locRes.data);
        if (divRes.success) setDivisions(divRes.data);
        if (jobRes.success) setJobTitles(jobRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.office_location_id) {
      setFilteredDivisions(divisions.filter((d) => d.office_location_id === formData.office_location_id));
      setFormData((prev) => ({ ...prev, division_id: undefined, job_title_id: undefined }));
    } else {
      setFilteredDivisions(divisions);
    }
  }, [formData.office_location_id, divisions]);

  useEffect(() => {
    if (formData.division_id) {
      setFilteredJobTitles(jobTitles.filter((j) => j.division_id === formData.division_id));
      setFormData((prev) => ({ ...prev, job_title_id: undefined }));
    } else {
      setFilteredJobTitles(jobTitles);
    }
  }, [formData.division_id, jobTitles]);

  const handleChange = (field: keyof StaffCreateData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.password) delete dataToSubmit.password;
      
      const response = await staffApi.create(dataToSubmit);
      if (response.success) {
        navigate('/staff');
      } else {
        setError(response.message || 'Failed to create employee');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/staff')} className="text-solarized-base01 hover:text-solarized-base02">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-solarized-base02 flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Add New Employee
          </h1>
          <p className="text-solarized-base01">Create a new staff member account</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white border-solarized-base2">
          <CardHeader>
            <CardTitle className="text-solarized-base02">Personal Information</CardTitle>
            <CardDescription className="text-solarized-base01">Basic details about the employee</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-solarized-base01">Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Work Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Password</Label>
              <Input
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Leave blank for auto-generated"
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Personal Email</Label>
              <Input
                type="email"
                value={formData.personal_email || ''}
                onChange={(e) => handleChange('personal_email', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Mobile Number</Label>
              <Input
                value={formData.mobile_number || ''}
                onChange={(e) => handleChange('mobile_number', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Birth Date</Label>
              <Input
                type="date"
                value={formData.birth_date || ''}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Gender</Label>
              <Select value={formData.gender || ''} onValueChange={(v) => handleChange('gender', v as 'male' | 'female' | 'other')}>
                <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white border-solarized-base2">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Nationality</Label>
              <Input
                value={formData.nationality || ''}
                onChange={(e) => handleChange('nationality', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label className="text-solarized-base01">Home Address</Label>
              <Textarea
                value={formData.home_address || ''}
                onChange={(e) => handleChange('home_address', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-solarized-base2">
          <CardHeader>
            <CardTitle className="text-solarized-base02">Employment Details</CardTitle>
            <CardDescription className="text-solarized-base01">Job and organizational information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-solarized-base01">Office Location</Label>
              <Select
                value={formData.office_location_id?.toString() || ''}
                onValueChange={(v) => handleChange('office_location_id', v ? parseInt(v) : undefined)}
              >
                <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-white border-solarized-base2">
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Division</Label>
              <Select
                value={formData.division_id?.toString() || ''}
                onValueChange={(v) => handleChange('division_id', v ? parseInt(v) : undefined)}
              >
                <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent className="bg-white border-solarized-base2">
                  {filteredDivisions.map((div) => (
                    <SelectItem key={div.id} value={div.id.toString()}>
                      {div.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Job Title</Label>
              <Select
                value={formData.job_title_id?.toString() || ''}
                onValueChange={(v) => handleChange('job_title_id', v ? parseInt(v) : undefined)}
              >
                <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                  <SelectValue placeholder="Select job title" />
                </SelectTrigger>
                <SelectContent className="bg-white border-solarized-base2">
                  {filteredJobTitles.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Hire Date</Label>
              <Input
                type="date"
                value={formData.hire_date || ''}
                onChange={(e) => handleChange('hire_date', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Employment Type</Label>
              <Select
                value={formData.employment_type || ''}
                onValueChange={(v) => handleChange('employment_type', v as 'full_time' | 'part_time' | 'contract' | 'intern')}
              >
                <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-solarized-base2">
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Compensation Type</Label>
              <Select
                value={formData.compensation_type || ''}
                onValueChange={(v) => handleChange('compensation_type', v as 'monthly' | 'hourly' | 'daily' | 'contract')}
              >
                <SelectTrigger className="bg-solarized-base2 border-solarized-base2 text-solarized-base02">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-solarized-base2">
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Base Salary</Label>
              <Input
                type="number"
                value={formData.base_salary || ''}
                onChange={(e) => handleChange('base_salary', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-solarized-base2">
          <CardHeader>
            <CardTitle className="text-solarized-base02">Bank Details</CardTitle>
            <CardDescription className="text-solarized-base01">Payment information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-solarized-base01">Account Holder Name</Label>
              <Input
                value={formData.bank_account_name || ''}
                onChange={(e) => handleChange('bank_account_name', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Account Number</Label>
              <Input
                value={formData.bank_account_number || ''}
                onChange={(e) => handleChange('bank_account_number', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Bank Name</Label>
              <Input
                value={formData.bank_name || ''}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Branch</Label>
              <Input
                value={formData.bank_branch || ''}
                onChange={(e) => handleChange('bank_branch', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-solarized-base2">
          <CardHeader>
            <CardTitle className="text-solarized-base02">Emergency Contact</CardTitle>
            <CardDescription className="text-solarized-base01">Contact in case of emergency</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-solarized-base01">Contact Name</Label>
              <Input
                value={formData.emergency_contact_name || ''}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Contact Phone</Label>
              <Input
                value={formData.emergency_contact_phone || ''}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-solarized-base01">Relationship</Label>
              <Input
                value={formData.emergency_contact_relationship || ''}
                onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                className="bg-solarized-base2 border-solarized-base2 text-solarized-base02"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/staff')} className="border-solarized-base2 text-solarized-base01 hover:bg-solarized-base2">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Employee
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
