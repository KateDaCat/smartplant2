import React, { useState, useEffect, useMemo } from 'react';
import IotDetailModal from '../components/IotDetailModal';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import SensorsIcon from '@mui/icons-material/Sensors';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fetchDevices, resolveDeviceAlerts } from '../services/apiClient'; // 👈 --- IMPORT API FUNCTIONS

const Iot = () => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [devices, setDevices] = useState([]); // Start with empty array
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); // Added for error handling

  // Load data function
  const loadData = async () => {
    try {
      const data = await fetchDevices(); // 👈 --- CALL THE API
      
      // ❗ --- DATA TRANSFORMATION --- ❗
      // Your backend returns 'alerts' as a string "motion, humidity"
      // We must convert it to an array for the frontend to work.
      const transformedData = data.map(device => ({
        ...device,
        // Check if alerts is a non-empty string, then split it
        alerts: (device.alerts && typeof device.alerts === 'string') 
          ? device.alerts.split(', ') 
          : [],
      }));

      setDevices(transformedData);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load device data. Please try again.");
    }
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    
    loadInitialData();
    
    // Auto-refresh every 30 seconds
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Manual refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter devices based on search
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    
    const normalizedQuery = searchQuery.toLowerCase();
    return devices.filter((device) => {
      const searchableText = [
        device.device_name,
        device.device_id,
        device.species_name,
        // ❗ FIXED: Backend provides coordinates, not location.name
        device.location.latitude.toString(),
        device.location.longitude.toString(),
      ].join(' ').toLowerCase();
      
      return searchableText.includes(normalizedQuery);
    });
  }, [searchQuery, devices]);

  // Separate alert devices
  const alertDevices = filteredDevices.filter(device => device.alerts && device.alerts.length > 0);
  const normalDevices = filteredDevices.filter(device => !device.alerts || device.alerts.length === 0);

  const handleViewDevice = (device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  // ❗ --- UPDATED: Resolve alerts via API --- ❗
  const handleResolveAlerts = async (rawDeviceId) => {
    try {
      // 1. Call the API to resolve alerts in the database
      await resolveDeviceAlerts(rawDeviceId);
      
      // 2. Refresh the data from the server to show the change
      await loadData(); 
    } catch (err) {
      console.error(`Failed to resolve alerts for device ${rawDeviceId}:`, err);
      alert("Failed to resolve alerts. Please try again.");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading devices...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && devices.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <WarningIcon style={{...styles.emptyIcon, color: '#dc2626'}} />
          <p style={styles.emptyText}>Error Loading Devices</p>
          <p style={styles.emptySubtext}>{error}</p>
          <button style={{...styles.refreshButton, marginTop: '16px'}} onClick={loadData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>IoT Monitoring</h1>
        <p style={styles.subtitle}>Real-time sensor data from all connected devices</p>
      </div>

      {/* Search Bar */}
      <div style={styles.searchBar}>
        <SearchIcon style={styles.searchIcon} />
        <input
          style={styles.searchInput}
          placeholder="Search by device, plant, or location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            style={styles.clearButton}
            onClick={() => setSearchQuery('')}
          >
            ×
          </button>
        )}
      </div>

      {/* Refresh Button */}
      <div style={styles.refreshContainer}>
        <button 
          style={styles.refreshButton}
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshIcon style={styles.refreshIcon} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Alert Devices Section */}
      {alertDevices.length > 0 && (
        <div style={styles.alertSection}>
          <div style={styles.sectionHeader}>
            <div style={styles.titleWithIcon}>
              <WarningIcon style={styles.alertTitleIcon} />
              <h3 style={styles.alertTitle}>Devices with Alerts</h3>
            </div>
            <div style={styles.alertCount}>{alertDevices.length} device(s) need attention</div>
          </div>
          <div style={styles.table}>
            {alertDevices.map(device => (
              <div key={device.device_id} style={styles.alertRow}>
                <div style={styles.cell}>
                  <div style={styles.plantName}>{device.species_name}</div>
                  {/* ❗ FIXED: Show coordinates as location.name isn't available */}
                  <div style={styles.location}>
                    Lat: {device.location.latitude.toFixed(4)}, 
                    Lng: {device.location.longitude.toFixed(4)}
                  </div>
                  <div style={styles.alertBadge}>
                    {/* This works now because we converted alerts to an array */}
                    Alerts: {device.alerts.join(', ')}
                  </div>
                </div>
                <div style={styles.cell}>
                  <div style={styles.deviceId}>{device.device_id}</div>
                  <div style={styles.deviceName}>{device.device_name}</div>
                </div>
                <div style={styles.cell}>
                  <div style={styles.actions}>
                    <button 
                      style={styles.resolveButton}
                      // ❗ FIXED: Pass the raw ID (e.g., 14) to the API
                      onClick={() => handleResolveAlerts(device.device_id_raw)}
                    >
                      <CheckCircleIcon style={styles.buttonIcon} />
                      Resolve
                    </button>
                    <button 
                      style={styles.viewButton}
                      onClick={() => handleViewDevice(device)}
                    >
                      <VisibilityIcon style={styles.buttonIcon} />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Normal Devices Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.titleWithIcon}>
            <SensorsIcon style={styles.sectionTitleIcon} />
            <h3 style={styles.sectionTitle}>All Devices</h3>
          </div>
          <div style={styles.deviceCount}>{normalDevices.length} device(s) normal</div>
        </div>
        
        {normalDevices.length > 0 ? (
          <div style={styles.table}>
            {normalDevices.map(device => (
              <div key={device.device_id} style={styles.row}>
                <div style={styles.cell}>
                  <div style={styles.plantName}>{device.species_name}</div>
                  {/* ❗ FIXED: Show coordinates as location.name isn't available */}
                  <div style={styles.location}>
                    Lat: {device.location.latitude.toFixed(4)}, 
                    Lng: {device.location.longitude.toFixed(4)}
                  </div>
                </div>
                <div style={styles.cell}>
                  <div style={styles.deviceId}>{device.device_id}</div>
                  <div style={styles.deviceName}>{device.device_name}</div>
                </div>
                <div style={styles.cell}>
                  <button 
                    style={styles.viewButton}
                    onClick={() => handleViewDevice(device)}
                  >
                    <VisibilityIcon style={styles.buttonIcon} />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            {searchQuery ? (
              <>
                <SearchIcon style={styles.emptyIcon} />
                <p style={styles.emptyText}>No devices found for "{searchQuery}"</p>
                <p style={styles.emptySubtext}>Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <SensorsIcon style={styles.emptyIcon} />
                <p style={styles.emptyText}>No devices available</p>
                <p style={styles.emptySubtext}>Devices will appear here when connected</p>
              </>
            )}
          </div>
        )}
      </div>

      {isModalOpen && selectedDevice && (
        <IotDetailModal 
          device={selectedDevice} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

// --- STYLES (Unchanged) ---
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f6f9f4',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2a37',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '16px',
    maxWidth: '500px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  searchIcon: {
    color: '#64748b',
    fontSize: '20px',
    marginRight: '12px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#0f172a',
    background: 'transparent',
  },
  clearButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshContainer: {
    marginBottom: '24px',
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  refreshIcon: {
    fontSize: '18px',
  },
  alertSection: {
    marginBottom: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  titleWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  alertTitleIcon: {
    color: '#dc2626',
    fontSize: '20px',
  },
  alertTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#dc2626',
    margin: 0,
  },
  sectionTitleIcon: {
    color: '#1f2a37',
    fontSize: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2a37',
    margin: 0,
  },
  alertCount: {
    fontSize: '12px',
    color: '#dc2626',
    fontWeight: '600',
  },
  deviceCount: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
  },
  table: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  row: {
    display: 'flex',
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  alertRow: {
    display: 'flex',
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #dc2626',
  },
  cell: {
    flex: 1,
    padding: '0 8px',
  },
  plantName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2a37',
    marginBottom: '4px',
  },
  location: {
    fontSize: '12px',
    color: '#64748b',
  },
  alertBadge: {
    fontSize: '11px',
    color: '#dc2626',
    fontWeight: '600',
    backgroundColor: '#fee2e2',
    padding: '2px 8px',
    borderRadius: '12px',
    marginTop: '4px',
    display: 'inline-block',
  },
  deviceId: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2a37',
    marginBottom: '4px',
  },
  deviceName: {
    fontSize: '12px',
    color: '#6b7280',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#1e88e5',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  resolveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  buttonIcon: {
    fontSize: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #3182ce',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '12px',
  },
};

// Add CSS for spinner
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  if (styleSheet) {
    try {
      styleSheet.insertRule(`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `, styleSheet.cssRules.length);
    } catch (e) {
      console.log('Could not insert spinner animation');
    }
  }
}

export default Iot;