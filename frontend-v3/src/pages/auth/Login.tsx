import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, AlertCircle, Shield, Users, Briefcase, User } from 'lucide-react';

interface FieldErrors {
  email?: string;
  password?: string;
}

const DEMO_ACCOUNTS = [
  {
    role: 'Administrator',
    email: 'admin@hrms.local',
    password: 'password',
    icon: Shield,
    color: 'bg-solarized-red',
    permissions: 'Full system access (581 permissions)',
    description: 'Complete control over all modules, users, and settings',
  },
  {
    role: 'HR Officer',
    email: 'hr@hrms.local',
    password: 'password',
    icon: Users,
    color: 'bg-solarized-blue',
    permissions: '~400 permissions',
    description: 'Manage employees, leave, payroll, recruitment',
  },
  {
    role: 'Manager',
    email: 'manager@hrms.local',
    password: 'password',
    icon: Briefcase,
    color: 'bg-solarized-yellow',
    permissions: '~200 permissions',
    description: 'Approve team leave, view attendance, performance reviews',
  },
  {
    role: 'Staff Member',
    email: 'staff@hrms.local',
    password: 'password',
    icon: User,
    color: 'bg-solarized-green',
    permissions: '~50 permissions',
    description: 'Self-service: clock in/out, apply leave, view payslips',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errorMessage = error.response?.data?.message || 'Invalid credentials. Please try again.';
      
      if (error.response?.data?.errors) {
        const apiErrors: FieldErrors = {};
        const errors = error.response.data.errors;
        if (errors.email) apiErrors.email = errors.email[0];
        if (errors.password) apiErrors.password = errors.password[0];
        setFieldErrors(apiErrors);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string, role: string) => {
    setError('');
    setDemoLoading(role);

    try {
      await login(demoEmail, demoPassword);
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || `Failed to login as ${role}. Please try again.`);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-solarized-base3 to-solarized-base2 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-solarized-blue rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">HR</span>
          </div>
          <h1 className="text-2xl font-bold text-solarized-base02">WorkDo HRMS</h1>
          <p className="text-solarized-base01 mt-1">Human Resource Management System</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className={fieldErrors.email ? 'text-red-500' : ''}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@hrms.local"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  aria-invalid={!!fieldErrors.email}
                  className="h-11"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className={fieldErrors.password ? 'text-red-500' : ''}>Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-solarized-blue hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  aria-invalid={!!fieldErrors.password}
                  className="h-11"
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-11 bg-solarized-blue hover:bg-solarized-blue/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
              <p className="text-sm text-center text-solarized-base01">
                Don't have an account?{' '}
                <Link to="/register" className="text-solarized-blue hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
          
          <div className="mt-6 pt-6 border-t border-solarized-base2 px-6 pb-6">
            <p className="text-sm font-medium text-solarized-base01 mb-4 text-center">
              Quick Demo Login
            </p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                return (
                  <Button
                    key={account.role}
                    type="button"
                    variant="outline"
                    className="h-auto py-3 px-3 flex flex-col items-start gap-1 hover:bg-solarized-base2/50 relative group"
                    onClick={() => handleDemoLogin(account.email, account.password, account.role)}
                    disabled={demoLoading !== null || isLoading}
                  >
                    {demoLoading === account.role ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      <>
                        <div className="flex items-center gap-2 w-full">
                          <div className={`w-6 h-6 rounded-full ${account.color} flex items-center justify-center`}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-medium text-sm">{account.role}</span>
                        </div>
                        <span className="text-xs text-solarized-base01 text-left">
                          {account.permissions}
                        </span>
                      </>
                    )}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-solarized-base02 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {account.description}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
