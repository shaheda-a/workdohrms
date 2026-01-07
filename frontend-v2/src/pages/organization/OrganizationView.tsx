import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizationService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
    ArrowLeft,
    Building2,
    MapPin,
    Edit,
} from 'lucide-react';

interface Organization {
    id: number;
    name: string;
    address: string;
    created_at?: string;
    updated_at?: string;
}

export default function OrganizationView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchOrganization(parseInt(id, 10));
        }
    }, [id]);

    const fetchOrganization = async (orgId: number) => {
        setIsLoading(true);
        try {
            const response = await organizationService.getById(orgId);
            if (response.data.success && response.data.data) {
                setOrganization(response.data.data);
            } else {
                showAlert('error', 'Error', 'Organization not found');
                navigate('/organizations');
            }
        } catch (error) {
            console.error('Failed to fetch organization:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch organization'));
            navigate('/organizations');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p>Organization not found</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/organizations')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organizations
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/organizations')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-solarized-base02">Organization Details</h1>
                        <p className="text-solarized-base01">View organization information</p>
                    </div>
                </div>
                <Button
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                    onClick={() => navigate('/organizations')}
                >
                    <Edit className="mr-2 h-4 w-4" /> Edit Organization
                </Button>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-solarized-blue" />
                        {organization.name}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Organization Name</label>
                                <p className="text-lg font-semibold text-solarized-base02">{organization.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Address</label>
                                <div className="flex items-start gap-2 mt-1">
                                    <MapPin className="h-4 w-4 text-solarized-base01 mt-1" />
                                    <p className="text-solarized-base02">{organization.address || 'No address provided'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Created At</label>
                                <p className="text-solarized-base02">{formatDate(organization.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Last Updated</label>
                                <p className="text-solarized-base02">{formatDate(organization.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
