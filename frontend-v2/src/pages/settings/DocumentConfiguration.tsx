import { useState, useEffect } from 'react';
import { documentLocationService, documentConfigService } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { HardDrive, Cloud, Database, Settings as SettingsIcon, Plus, Edit2, Shield, FolderOpen } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';

type StorageType = 'local' | 'wasabi' | 'aws';

export default function DocumentConfiguration() {
    const { user } = useAuth();
    const [locations, setLocations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedStorage, setSelectedStorage] = useState<any>(null);
    const [configForm, setConfigForm] = useState<any>({
        is_active: true,
        root_path: '',
        bucket: '',
        region: '',
        access_key: '',
        secret_key: '',
        endpoint: '',
    });

    useEffect(() => {
        fetchLocations();
    }, []);


    const fetchLocations = async () => {
        try {
            const response = await documentLocationService.getAll({});
            const locationData = response.data.data;
            const payload = Array.isArray(locationData) ? locationData : (locationData?.data || []);

            // Fetch configs for each location
            const locationsWithConfigs = await Promise.all(payload.map(async (loc: any) => {
                try {
                    const configRes = await documentConfigService.getConfig(loc.id);
                    return { ...loc, config: configRes.data.data };
                } catch (e) {
                    return { ...loc, config: null };
                }
            }));

            setLocations(locationsWithConfigs);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        }
    };

    const getConfiguredLocations = (locationType: number) => {
        return locations.filter(loc => loc.location_type === locationType);
    };

    const openConfigModal = (card: any) => {
        setSelectedStorage(card);
        // Reset form or populate if editing (not implemented yet for simplicity, but could be added)
        setConfigForm({
            is_active: true,
            root_path: '',
            bucket: '',
            region: '',
            access_key: '',
            secret_key: '',
            endpoint: '',
        });
        setIsConfigModalOpen(true);
    };

    const handleSaveConfig = async () => {
        if (!user?.org_id || !user?.company_id || !selectedStorage) return;

        setIsLoading(true);
        try {
            // 1. Create Document Location if it doesn't exist for this type/org/company
            // For now, we always create a new one to match the "Add Configuration" flow
            const locResponse = await documentLocationService.create({
                location_type: selectedStorage.locationType,
                org_id: Number(user.org_id),
                company_id: Number(user.company_id),
            });
            const locationId = locResponse.data.data.id;

            // 2. Create specific config
            if (selectedStorage.type === 'local') {
                await documentConfigService.createLocal({
                    location_id: locationId,
                    root_path: configForm.root_path,
                    is_active: configForm.is_active
                });
            } else if (selectedStorage.type === 'wasabi') {
                await documentConfigService.createWasabi({
                    location_id: locationId,
                    ...configForm
                });
            } else if (selectedStorage.type === 'aws') {
                await documentConfigService.createAws({
                    location_id: locationId,
                    bucket: configForm.bucket,
                    region: configForm.region,
                    access_key: configForm.access_key,
                    secret_key: configForm.secret_key,
                    is_active: configForm.is_active
                });
            }

            toast({
                title: 'Success',
                description: `${selectedStorage.title} configuration saved successfully`,
            });

            setIsConfigModalOpen(false);
            fetchLocations();
        } catch (error: any) {
            console.error('Failed to save configuration:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save configuration';
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errorMsg,
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


            {/* Storage Type Cards */}
            <div className="grid gap-6 grid-cols-1">
                {storageCards.map((card) => {
                    const Icon = card.icon;
                    const configuredLocations = getConfiguredLocations(card.locationType);

                    return (
                        <Card
                            key={card.type}
                            className="border-0 shadow-md"
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{card.title}</CardTitle>
                                        <CardDescription>{card.description}</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-solarized-blue hover:bg-solarized-blue/90"
                                    onClick={() => openConfigModal(card)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Configuration
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border border-solarized-base3">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-solarized-base3/50">
                                                <TableHead className="w-[200px]">Organization</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Configuration Details</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {configuredLocations.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-solarized-base01">
                                                        No configurations found for {card.title}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                configuredLocations.map((loc) => (
                                                    <TableRow key={loc.id}>
                                                        <TableCell className="font-medium text-solarized-base01">
                                                            {loc.organization?.name || 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-solarized-base01">
                                                            {loc.company?.company_name || 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col text-xs text-solarized-base01">
                                                                {card.type === 'local' && (
                                                                    <div className="flex items-center gap-1">
                                                                        <FolderOpen className="h-3 w-3" />
                                                                        <span>{loc.config?.root_path || 'Not Configured'}</span>
                                                                    </div>
                                                                )}
                                                                {(card.type === 'wasabi' || card.type === 'aws') && (
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="flex items-center gap-1 font-semibold">
                                                                            <Shield className="h-3 w-3" />
                                                                            <span>{loc.config?.bucket || 'N/A'} ({loc.config?.region || 'N/A'})</span>
                                                                        </div>
                                                                        {card.type === 'wasabi' && (
                                                                            <span className="text-[10px] opacity-70 truncate max-w-[200px]">
                                                                                {loc.config?.endpoint}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={loc.config?.is_active ? 'default' : 'secondary'} className={loc.config?.is_active ? "bg-solarized-green/10 text-solarized-green border-solarized-green/20" : ""}>
                                                                {loc.config?.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-solarized-blue">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Configuration Modal */}
            <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Configure {selectedStorage?.title}</DialogTitle>
                        <DialogDescription>
                            Enter the details for your {selectedStorage?.title} storage integration.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {selectedStorage?.type === 'local' && (
                            <div className="space-y-2">
                                <Label htmlFor="root_path">Root Path *</Label>
                                <Input
                                    id="root_path"
                                    placeholder="/var/www/uploads"
                                    value={configForm.root_path}
                                    onChange={(e) => setConfigForm({ ...configForm, root_path: e.target.value })}
                                />
                                <p className="text-xs text-solarized-base01">The absolute path on the server where documents will be stored.</p>
                            </div>
                        )}

                        {(selectedStorage?.type === 'wasabi' || selectedStorage?.type === 'aws') && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bucket">Bucket Name *</Label>
                                        <Input
                                            id="bucket"
                                            value={configForm.bucket}
                                            onChange={(e) => setConfigForm({ ...configForm, bucket: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="region">Region *</Label>
                                        <Input
                                            id="region"
                                            placeholder="us-east-1"
                                            value={configForm.region}
                                            onChange={(e) => setConfigForm({ ...configForm, region: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="access_key">Access Key *</Label>
                                    <Input
                                        id="access_key"
                                        type="password"
                                        value={configForm.access_key}
                                        onChange={(e) => setConfigForm({ ...configForm, access_key: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secret_key">Secret Key *</Label>
                                    <Input
                                        id="secret_key"
                                        type="password"
                                        value={configForm.secret_key}
                                        onChange={(e) => setConfigForm({ ...configForm, secret_key: e.target.value })}
                                    />
                                </div>
                                {selectedStorage?.type === 'wasabi' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="endpoint">Endpoint URL *</Label>
                                        <Input
                                            id="endpoint"
                                            placeholder="https://s3.wasabisys.com"
                                            value={configForm.endpoint}
                                            onChange={(e) => setConfigForm({ ...configForm, endpoint: e.target.value })}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="is_active"
                                checked={configForm.is_active}
                                onCheckedChange={(checked) => setConfigForm({ ...configForm, is_active: checked })}
                            />
                            <Label htmlFor="is_active">Set as Active</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-solarized-blue hover:bg-solarized-blue/90"
                            onClick={handleSaveConfig}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
