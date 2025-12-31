import { useState, useEffect } from 'react';
import { documentLocationService } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { HardDrive, Cloud, Database, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';

interface DocumentLocation {
    id: number;
    location_type: number;
    org_id?: number;
    company_id?: number;
    organization?: { name: string };
    company?: { company_name: string };
}


type StorageType = 'local' | 'wasabi' | 'aws';

const STORAGE_CARDS = [
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

export default function DocumentConfiguration() {
    const { user } = useAuth();
    const [locations, setLocations] = useState<DocumentLocation[]>([]);
    const [loadingType, setLoadingType] = useState<StorageType | null>(null);

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

    const getConfiguredLocations = (locationType: number) => {
        return locations.filter(loc => loc.location_type === locationType);
    };

    const handleConfigureStorage = async (locationType: number, type: StorageType) => {
        if (loadingType) return; // Prevent concurrent requests

        if (!user?.org_id || !user?.company_id) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'User organization or company not found. Please log in again.',
            });
            return;
        }

        setLoadingType(type);
        try {
            await documentLocationService.create({
                location_type: locationType,
                org_id: Number(user.org_id),
                company_id: Number(user.company_id),
            });

            toast({
                title: 'Success',
                description: `${type.charAt(0).toUpperCase()}${type.slice(1)} storage configured successfully`,
            });

            fetchLocations();
        } catch (error) {
            console.error('Failed to configure storage:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to configure storage location',
            });
        } finally {
            setLoadingType(null);
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


            {/* Storage Type Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {STORAGE_CARDS.map((card) => {
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
                                        <div className="text-xs text-solarized-base01 mb-2 max-h-20 overflow-y-auto">
                                            {configuredLocations.map(loc => (
                                                <div key={loc.id} className="truncate">
                                                    • {loc.organization?.name || 'N/A'} - {loc.company?.company_name || 'N/A'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        className="bg-solarized-blue hover:bg-solarized-blue/90 w-full"
                                        onClick={() => handleConfigureStorage(card.locationType, card.type)}
                                        disabled={loadingType === card.type}
                                    >
                                        {loadingType === card.type ? 'Configuring...' : 'Configure'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
