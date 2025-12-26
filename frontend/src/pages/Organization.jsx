import { useEffect, useState } from 'react';
import { Plus, Building, Users, Briefcase } from 'lucide-react';
import { organizationService } from '../services/organizationService';
import './Organization.css';

export default function Organization() {
    const [activeTab, setActiveTab] = useState('locations');
    const [locations, setLocations] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [jobTitles, setJobTitles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const extractData = (response) => {
        // Handle various API response structures
        if (response.data?.data?.data) return response.data.data.data;
        if (response.data?.data) return Array.isArray(response.data.data) ? response.data.data : [];
        if (response.data) return Array.isArray(response.data) ? response.data : [];
        return [];
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'locations') {
                const response = await organizationService.getOfficeLocations();
                setLocations(extractData(response));
            } else if (activeTab === 'divisions') {
                const response = await organizationService.getDivisions();
                setDivisions(extractData(response));
            } else if (activeTab === 'titles') {
                const response = await organizationService.getJobTitles();
                setJobTitles(extractData(response));
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="organization-page">
            <div className="page-header">
                <div>
                    <h1>Organization Structure</h1>
                    <p>Manage locations, divisions, and job titles</p>
                </div>
            </div>

            <div className="card">
                <div className="org-tabs">
                    <button
                        className={activeTab === 'locations' ? 'active' : ''}
                        onClick={() => setActiveTab('locations')}
                    >
                        <Building size={18} />
                        Office Locations
                    </button>
                    <button
                        className={activeTab === 'divisions' ? 'active' : ''}
                        onClick={() => setActiveTab('divisions')}
                    >
                        <Users size={18} />
                        Divisions
                    </button>
                    <button
                        className={activeTab === 'titles' ? 'active' : ''}
                        onClick={() => setActiveTab('titles')}
                    >
                        <Briefcase size={18} />
                        Job Titles
                    </button>
                </div>

                <div className="tab-header">
                    <h3>
                        {activeTab === 'locations' && 'Office Locations'}
                        {activeTab === 'divisions' && 'Divisions'}
                        {activeTab === 'titles' && 'Job Titles'}
                    </h3>
                    <button className="btn btn-primary btn-sm">
                        <Plus size={16} />
                        Add New
                    </button>
                </div>

                <div className="org-grid">
                    {loading ? (
                        <p className="text-center">Loading...</p>
                    ) : (
                        <>
                            {activeTab === 'locations' && locations.length === 0 && (
                                <p className="empty-state">No locations found</p>
                            )}
                            {activeTab === 'divisions' && divisions.length === 0 && (
                                <p className="empty-state">No divisions found</p>
                            )}
                            {activeTab === 'titles' && jobTitles.length === 0 && (
                                <p className="empty-state">No job titles found</p>
                            )}

                            {activeTab === 'locations' && locations.map(loc => (
                                <div key={loc.id} className="org-item">
                                    <div className="org-icon">
                                        <Building size={24} />
                                    </div>
                                    <div className="org-content">
                                        <h4>{loc.title}</h4>
                                        <p>{loc.address || 'No address'}</p>
                                        {loc.is_active && <span className="badge badge-success">Active</span>}
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'divisions' && divisions.map(div => (
                                <div key={div.id} className="org-item">
                                    <div className="org-icon">
                                        <Users size={24} />
                                    </div>
                                    <div className="org-content">
                                        <h4>{div.title}</h4>
                                        <p>{div.office_location?.title || 'No location'}</p>
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'titles' && jobTitles.map(title => (
                                <div key={title.id} className="org-item">
                                    <div className="org-icon">
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="org-content">
                                        <h4>{title.title}</h4>
                                        <p>{title.division?.title || 'No division'}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
