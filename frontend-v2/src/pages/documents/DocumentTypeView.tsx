import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentTypeService } from '../../services/api';
import { showAlert, getErrorMessage } from '../../lib/sweetalert';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Badge } from '../../components/ui/badge';
import {
    ArrowLeft,
    FileText,
    Edit,
    User,
    Building2,
    Calculator,
} from 'lucide-react';

interface DocumentType {
    id: number;
    title: string;
    notes: string;
    owner_type: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

const OWNER_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
    employee: { label: 'Employee', icon: <User className="h-4 w-4" /> },
    company: { label: 'Company', icon: <Building2 className="h-4 w-4" /> },
    accountant: { label: 'Accountant', icon: <Calculator className="h-4 w-4" /> },
};

export default function DocumentTypeView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [documentType, setDocumentType] = useState<DocumentType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchDocumentType(parseInt(id, 10));
        }
    }, [id]);

    const fetchDocumentType = async (docTypeId: number) => {
        setIsLoading(true);
        try {
            const response = await documentTypeService.getById(docTypeId);
            if (response.data.success && response.data.data) {
                setDocumentType(response.data.data);
            } else {
                showAlert('error', 'Error', 'Document type not found');
                navigate('/documents/types');
            }
        } catch (error) {
            console.error('Failed to fetch document type:', error);
            showAlert('error', 'Error', getErrorMessage(error, 'Failed to fetch document type'));
            navigate('/documents/types');
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

    const getOwnerTypeInfo = (ownerType: string) => {
        return OWNER_TYPE_LABELS[ownerType] || { label: ownerType, icon: <FileText className="h-4 w-4" /> };
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

    if (!documentType) {
        return (
            <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p>Document type not found</p>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate('/documents/types')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Document Types
                </Button>
            </div>
        );
    }

    const ownerTypeInfo = getOwnerTypeInfo(documentType.owner_type);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/documents/types')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-solarized-base02">Document Type Details</h1>
                        <p className="text-solarized-base01">View document type information</p>
                    </div>
                </div>
                <Button
                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                    onClick={() => navigate('/documents/types')}
                >
                    <Edit className="mr-2 h-4 w-4" /> Edit Document Type
                </Button>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-solarized-blue" />
                        {documentType.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Title</label>
                                <p className="text-lg font-semibold text-solarized-base02">{documentType.title}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Owner Type</label>
                                <div className="flex items-center gap-2 mt-1">
                                    {ownerTypeInfo.icon}
                                    <Badge variant="outline" className="text-solarized-blue capitalize">
                                        {ownerTypeInfo.label}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Status</label>
                                <div className="mt-1">
                                    <Badge
                                        className={
                                            documentType.is_active
                                                ? 'bg-solarized-green/10 text-solarized-green'
                                                : 'bg-solarized-base01/10 text-solarized-base01'
                                        }
                                    >
                                        {documentType.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Notes</label>
                                <p className="text-solarized-base02 mt-1">
                                    {documentType.notes || 'No notes provided'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Created At</label>
                                <p className="text-solarized-base02">{formatDate(documentType.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-solarized-base01">Last Updated</label>
                                <p className="text-solarized-base02">{formatDate(documentType.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
