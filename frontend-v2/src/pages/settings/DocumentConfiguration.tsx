import { useState, useEffect } from 'react';
import { documentLocationService, organizationService, companyService } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { HardDrive, Cloud, Database, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Badge } from '../../components/ui/badge';

interface DocumentLocation {
    id: number;
    location_type: number;
    org_id?: number;
    company_id?: number;
    organization?: { name: string };
    company?: { company_name: string };
}

interface Organization {
    id: number;
    name: string;
}

interface Company {
    id: number;
    company_name: string;
}

type StorageType = 'local' | 'wasabi' | 'aws';

export default function DocumentConfiguration() {
    const [locations, setLocations] = useState<DocumentLocation[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<StorageType | null>(null);
    const [selectedLocationType, setSelectedLocationType] = useState<number>(0);

    const [formData, setFormData] = useState({
        org_id: '',
        company_id: '',
    });

    useEffect(() => {
        fetchLocations();
        fetchOrganizations();
        fetchCompanies();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const response = await organizationService.getAll({});
            const payload = response.data.data;
            if (Array.isArray(payload)) {
                setOrganizations(payload);
            } else if (payload && Array.isArray(payload.data)) {
                setOrganizations(payload.data);
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await companyService.getAll({});
            const payload = response.data.data;
            if (Array.isArray(payload)) {
                setCompanies(payload);
            } else if (payload && Array.isArray(payload.data)) {
                setCompanies(payload.data);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    };

    const fetchLocations = async () => {
        try {
            const response = await documentLocationService.getAll({});
            const payload = response.data.data;
            if (Array.isArray(payload)) {
                setLocations(payload);
            } else if (payload && Array.isArray(payload.data)) {
                setLocations(payload.data);
            }
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        }
    };

    const getConfiguredLocations = (locationType: number) => {
        return locations.filter(loc => loc.location_type === locationType);
    };

    const handleCardClick = (type: StorageType, locationType: number) => {
        setSelectedType(type);
        setSelectedLocationType(locationType);
        setFormData({ org_id: '', company_id: '' });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.org_id || !formData.company_id) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select both organization and company',
            });
            return;
        }

        setIsLoading(true);
        try {
            await documentLocationService.create({
                location_type: selectedLocationType,
                org_id: Number(formData.org_id),
                company_id: Number(formData.company_id),
            });

            toast({
                title: 'Success',
                description: `${selectedType?.charAt(0).toUpperCase()}${selectedType?.slice(1)} storage configured successfully`,
            });

            setIsDialogOpen(false);
            setFormData({ org_id: '', company_id: '' });
            fetchLocations();
        } catch (error) {
            console.error('Failed to configure storage:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to configure storage location',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const storageCards = [
        {
            type: 'local' as StorageType,
            title: 'Local Storage',
            description: 'Store documents on local server',
            icon: HardDrive,
            color: 'bg-solarized-blue',
            locationType: 1,
        },
        {
            type: 'wasabi' as StorageType,
            title: 'Wasabi Cloud',
            description: 'Store documents on Wasabi cloud storage',
            icon: Cloud,
            color: 'bg-solarized-green',
            locationType: 2,
        },
        {
            type: 'aws' as StorageType,
            title: 'AWS S3',
            description: 'Store documents on Amazon S3',
            icon: Database,
            color: 'bg-solarized-yellow',
            locationType: 3,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <SettingsIcon className="h-8 w-8 text-solarized-blue" />
                <div>
                    <h1 className="text-2xl font-bold text-solarized-base02">Document Configuration</h1>
                    <p className="text-solarized-base01">Configure document storage settings</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {storageCards.map((card) => {
                    const Icon = card.icon;
                    const configuredLocations = getConfiguredLocations(card.locationType);

                    return (
                        <Card
                            key={card.type}
                            className="border-0 shadow-md hover:shadow-lg transition-shadow"
                        >
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{card.title}</CardTitle>
                                    {configuredLocations.length > 0 && (
                                        <Badge className="bg-solarized-green/10 text-solarized-green">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            {configuredLocations.length}
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription>{card.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {configuredLocations.length > 0 && (
                                        <div className="text-xs text-solarized-base01 mb-2">
                                            {configuredLocations.map(loc => (
                                                <div key={loc.id}>
                                                    • {loc.organization?.name || 'N/A'} - {loc.company?.company_name || 'N/A'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        className="bg-solarized-blue hover:bg-solarized-blue/90 w-full"
                                        onClick={() => handleCardClick(card.type, card.locationType)}
                                        disabled={isLoading}
                                    >
                                        Add Configuration
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Configure {selectedType === 'local' ? 'Local Storage' : selectedType === 'wasabi' ? 'Wasabi Cloud' : 'AWS S3'}
                        </DialogTitle>
                        <DialogDescription>
                            Select organization and company for this storage location
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="org_id">Organization *</Label>
                                <Select
                                    value={formData.org_id}
                                    onValueChange={(value) => setFormData({ ...formData, org_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations.map((org) => (
                                            <SelectItem key={org.id} value={String(org.id)}>
                                                {org.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_id">Company *</Label>
                                <Select
                                    value={formData.company_id}
                                    onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company) => (
                                            <SelectItem key={company.id} value={String(company.id)}>
                                                {company.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
