import { useState, useEffect } from 'react';
import { documentConfigService, documentLocationService } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
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
import { HardDrive, Cloud, Database, Settings as SettingsIcon } from 'lucide-react';
import { toast } from '../../hooks/use-toast';

interface DocumentLocation {
    id: number;
    location_type: number;
    organization?: { name: string };
    company?: { company_name: string };
}

type StorageType = 'local' | 'wasabi' | 'aws';

export default function DocumentConfiguration() {
    const [locations, setLocations] = useState<DocumentLocation[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<StorageType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data for each storage type
    const [localFormData, setLocalFormData] = useState({
        location_id: '',
        root_path: '',
        is_active: true,
    });

    const [wasabiFormData, setWasabiFormData] = useState({
        location_id: '',
        bucket_name: '',
        region: '',
        access_key: '',
        secret_key: '',
        is_active: true,
    });

    const [awsFormData, setAwsFormData] = useState({
        location_id: '',
        bucket_name: '',
        region: '',
        access_key: '',
        secret_key: '',
        is_active: true,
    });

    useEffect(() => {
        fetchLocations();
    }, []);

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

    const getLocationsByType = (type: number) => {
        return locations.filter(loc => loc.location_type === type);
    };

    const handleCardClick = (type: StorageType) => {
        setSelectedType(type);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (selectedType === 'local') {
                await documentConfigService.storeLocal(localFormData);
                toast({
                    title: 'Success',
                    description: 'Local storage configuration saved successfully',
                });
            } else if (selectedType === 'wasabi') {
                await documentConfigService.storeWasabi(wasabiFormData);
                toast({
                    title: 'Success',
                    description: 'Wasabi storage configuration saved successfully',
                });
            } else if (selectedType === 'aws') {
                await documentConfigService.storeAws(awsFormData);
                toast({
                    title: 'Success',
                    description: 'AWS storage configuration saved successfully',
                });
            }
            setIsDialogOpen(false);
            resetForms();
        } catch (error) {
            console.error('Failed to save configuration:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save storage configuration',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForms = () => {
        setLocalFormData({ location_id: '', root_path: '', is_active: true });
        setWasabiFormData({ location_id: '', bucket_name: '', region: '', access_key: '', secret_key: '', is_active: true });
        setAwsFormData({ location_id: '', bucket_name: '', region: '', access_key: '', secret_key: '', is_active: true });
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

    const renderFormFields = () => {
        const currentLocations = selectedType
            ? getLocationsByType(storageCards.find(c => c.type === selectedType)?.locationType || 0)
            : [];

        if (selectedType === 'local') {
            return (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="location_id">Document Location *</Label>
                        <Select
                            value={localFormData.location_id}
                            onValueChange={(value) => setLocalFormData({ ...localFormData, location_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentLocations.map((loc) => (
                                    <SelectItem key={loc.id} value={String(loc.id)}>
                                        {loc.organization?.name || loc.company?.company_name || `Location ${loc.id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="root_path">Root Path *</Label>
                        <Input
                            id="root_path"
                            value={localFormData.root_path}
                            onChange={(e) => setLocalFormData({ ...localFormData, root_path: e.target.value })}
                            placeholder="/var/www/documents"
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={localFormData.is_active}
                            onCheckedChange={(checked) => setLocalFormData({ ...localFormData, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>
                </>
            );
        } else if (selectedType === 'wasabi') {
            return (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="location_id">Document Location *</Label>
                        <Select
                            value={wasabiFormData.location_id}
                            onValueChange={(value) => setWasabiFormData({ ...wasabiFormData, location_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentLocations.map((loc) => (
                                    <SelectItem key={loc.id} value={String(loc.id)}>
                                        {loc.organization?.name || loc.company?.company_name || `Location ${loc.id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bucket_name">Bucket Name *</Label>
                        <Input
                            id="bucket_name"
                            value={wasabiFormData.bucket_name}
                            onChange={(e) => setWasabiFormData({ ...wasabiFormData, bucket_name: e.target.value })}
                            placeholder="my-bucket"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="region">Region *</Label>
                        <Input
                            id="region"
                            value={wasabiFormData.region}
                            onChange={(e) => setWasabiFormData({ ...wasabiFormData, region: e.target.value })}
                            placeholder="us-east-1"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="access_key">Access Key *</Label>
                        <Input
                            id="access_key"
                            value={wasabiFormData.access_key}
                            onChange={(e) => setWasabiFormData({ ...wasabiFormData, access_key: e.target.value })}
                            placeholder="Access Key"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secret_key">Secret Key *</Label>
                        <Input
                            id="secret_key"
                            type="password"
                            value={wasabiFormData.secret_key}
                            onChange={(e) => setWasabiFormData({ ...wasabiFormData, secret_key: e.target.value })}
                            placeholder="Secret Key"
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={wasabiFormData.is_active}
                            onCheckedChange={(checked) => setWasabiFormData({ ...wasabiFormData, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>
                </>
            );
        } else if (selectedType === 'aws') {
            return (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="location_id">Document Location *</Label>
                        <Select
                            value={awsFormData.location_id}
                            onValueChange={(value) => setAwsFormData({ ...awsFormData, location_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentLocations.map((loc) => (
                                    <SelectItem key={loc.id} value={String(loc.id)}>
                                        {loc.organization?.name || loc.company?.company_name || `Location ${loc.id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bucket_name">Bucket Name *</Label>
                        <Input
                            id="bucket_name"
                            value={awsFormData.bucket_name}
                            onChange={(e) => setAwsFormData({ ...awsFormData, bucket_name: e.target.value })}
                            placeholder="my-s3-bucket"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="region">Region *</Label>
                        <Input
                            id="region"
                            value={awsFormData.region}
                            onChange={(e) => setAwsFormData({ ...awsFormData, region: e.target.value })}
                            placeholder="us-east-1"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="access_key">Access Key *</Label>
                        <Input
                            id="access_key"
                            value={awsFormData.access_key}
                            onChange={(e) => setAwsFormData({ ...awsFormData, access_key: e.target.value })}
                            placeholder="AWS Access Key"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="secret_key">Secret Key *</Label>
                        <Input
                            id="secret_key"
                            type="password"
                            value={awsFormData.secret_key}
                            onChange={(e) => setAwsFormData({ ...awsFormData, secret_key: e.target.value })}
                            placeholder="AWS Secret Key"
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={awsFormData.is_active}
                            onCheckedChange={(checked) => setAwsFormData({ ...awsFormData, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>
                </>
            );
        }
    };

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
                    const availableLocations = getLocationsByType(card.locationType);

                    return (
                        <Card
                            key={card.type}
                            className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleCardClick(card.type)}
                        >
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle>{card.title}</CardTitle>
                                <CardDescription>{card.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-solarized-base01">
                                        {availableLocations.length} location{availableLocations.length !== 1 ? 's' : ''} available
                                    </span>
                                    <Button size="sm" className="bg-solarized-blue hover:bg-solarized-blue/90">
                                        Configure
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
                            Set up your {selectedType} storage configuration
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {renderFormFields()}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-solarized-blue hover:bg-solarized-blue/90" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
