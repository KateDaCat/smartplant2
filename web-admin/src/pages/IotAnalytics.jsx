import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { fetchDeviceHistory } from '../services/apiClient'; 
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

const RANGE_PRESETS = {
  '1H': { label: 'Last Hour', windowMs: 1 * 60 * 60 * 1000 },
  '24H': { label: '24 Hours', windowMs: 24 * 60 * 60 * 1000 },
  '7D': { label: '7 Days', windowMs: 7 * 24 * 60 * 60 * 1000 },
};

const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#F97316', digits: 1 },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#2563EB', digits: 0 },
  { key: 'soil_moisture', label: 'Soil Moisture', unit: '%', color: '#22C55E', digits: 0 },
  // 👈 --- ADDED MOTION CHART ---
  { 
    key: 'motion_detected', 
    label: 'Motion', 
    unit: '', // No unit for 0 or 1
    color: '#8B5CF6', // Purple color
    digits: 0,
    // ❗ --- 'isStepChart' flag removed. This will now be a line chart. ---
  },
];

const formatNumber = (value, digits = 0) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return value.toFixed(digits);
};

const formatAxisLabel = (timestamp, rangeKey) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '--';
  if (rangeKey === '7D') {
    return date.toLocaleString([], { day: '2-digit', month: 'short' });
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// MetricChart Component
const MetricChart = ({ data, metric, rangeKey, chartWidth }) => {
  const chartHeight = 164;
  const topPadding = 18;
  const bottomPadding = 28;

  const isMotion = metric.key === 'motion_detected';

  const filteredEntries = data.filter(
    (entry) =>
      (typeof entry[metric.key] === 'number' && !Number.isNaN(entry[metric.key])) ||
      typeof entry[metric.key] === 'boolean' // 👈 --- ADD THIS CONDITION
  );
  const metricValues = filteredEntries.map((entry) => entry[metric.key]);

  if (metricValues.length === 0) {
    return (
      <div style={styles.metricCard}>
        <div style={styles.metricTitle}>{metric.label}</div>
        <div style={styles.metricEmpty}>No readings available for this window.</div>
      </div>
    );
  }

  const min = Math.min(...metricValues);
  const max = Math.max(...metricValues);
  const span = max - min || 1;
  const sum = metricValues.reduce((s, v) => s + v, 0);
  const avg = sum / metricValues.length;
  
  const delta =
    metricValues.length > 1
      ? metricValues[metricValues.length - 1] - metricValues[0]
      : 0;

  const color = metric.color;

  const points = filteredEntries.map((entry, index) => {
    const value = entry[metric.key];
    const x =
      filteredEntries.length > 1
        ? (index / (filteredEntries.length - 1)) * chartWidth
        : chartWidth / 2;
    const normalized = (value - min) / span;
    const y =
      chartHeight -
      (normalized * (chartHeight - topPadding - bottomPadding) + bottomPadding);
    return {
      x,
      y,
      timestamp: entry.timestamp,
      value,
    };
  });

  // ❗ --- This is now a standard line chart for all metrics ---
  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    const y =
      chartHeight -
      (ratio * (chartHeight - topPadding - bottomPadding) + bottomPadding);
    return { y };
  });

  const axisLabels = [
    points[0],
    points[Math.floor(points.length / 2)] ?? points[points.length - 1],
    points[points.length - 1],
  ];

  const deltaColor =
    delta === 0 ? '#475467' : delta > 0 ? '#16A34A' : '#DC2626';
  const DeltaIcon = delta === 0 ? TrendingFlatIcon : delta > 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div style={styles.metricCard}>
      <div style={styles.metricHeader}>
        <div style={styles.metricTitle}>{metric.label}</div>
        <div style={styles.metricHeaderRight}>
          <DeltaIcon style={{ fontSize: 16, color: deltaColor }} />
          <div style={{ ...styles.metricDelta, color: deltaColor }}>
            {delta > 0 ? '+' : ''}
            {formatNumber(delta, metric.digits)}
            {!isMotion && metric.unit}
          </div>
        </div>
      </div>

      <div style={styles.metricSummaryRow}>
        <div style={styles.metricSummaryItem}>
          <div style={styles.metricSummaryLabel}>Latest</div>
          <div style={styles.metricSummaryValue}>
            {formatNumber(metricValues[metricValues.length - 1], metric.digits)}
            {!isMotion && metric.unit}
          </div>
        </div>

        {/* 👈 --- This "Total Events" logic is kept --- */}
        <div style={styles.metricSummaryItem}>
          <div style={styles.metricSummaryLabel}>
            {isMotion ? 'Total Events' : 'Average'}
          </div>
          <div style={styles.metricSummaryValue}>
            {isMotion 
              ? sum 
              : formatNumber(avg, metric.digits)
            }
            {isMotion ? (sum === 1 ? ' event' : ' events') : metric.unit}
          </div>
        </div>

        <div style={styles.metricSummaryItem}>
          <div style={styles.metricSummaryLabel}>Range</div>
          <div style={styles.metricSummaryValue}>
            {formatNumber(min, metric.digits)}–{formatNumber(max, metric.digits)}
            {!isMotion && metric.unit}
          </div>
        </div>
      </div>

      <div style={styles.chartCanvas}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {gridLines.map((line, index) => (
            <line
              key={`grid-${index}`}
              x1="0"
              y1={line.y}
              x2={chartWidth}
              y2={line.y}
              stroke="#E2E8F0"
              strokeDasharray="4 6"
      
              strokeWidth={1}
            />
          ))}

          <polyline
            points={polylinePoints} // 👈 --- Renders the line chart
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
            <circle
              key={`${metric.key}-dot-${index}`}
              cx={point.x}
              cy={point.y}
              r={rangeKey === '7D' ? 0 : 3.2}
              fill="#FFFFFF"
              stroke={color}
              strokeWidth={rangeKey === '7D' ? 0 : 2}
            />
          ))}
        </svg>
      </div>

      <div style={styles.chartXAxisRow}>
        {axisLabels.map((point, index) => (
          <div key={`${metric.key}-axis-${index}`} style={styles.chartXAxisLabel}>
            {formatAxisLabel(point?.timestamp, rangeKey)}
          </div>
        ))}
      </div>
    </div>
  );
};

const IotAnalytics = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState('24H');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const device = location.state?.device || {};
  const deviceIdRaw = device?.device_id_raw;
  const activeAlerts = device.alerts ? device.alerts.length : 0;
  const latestEntry = history.length > 0 ? history[history.length - 1] : null;

  const chartWidth = 540;

  useEffect(() => {
    if (!deviceIdRaw) { 
      setError('No device ID provided');
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDeviceHistory(deviceIdRaw, selectedRange);
        setHistory(data);
      } catch (err) {
        console.error('Failed to load history:', err);
        setError('Could not load device history.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [deviceIdRaw, selectedRange]);

  const handleBack = () => {
    navigate(-1); 
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.centered}>
          <div style={styles.spinner}></div>
          <div style={styles.loadingText}>Loading history...</div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div style={styles.centered}>
          <div style={styles.errorText}>{error}</div>
        </div>
      );
    }
    
    if (history.length === 0) {
      return (
        <div style={styles.centered}>
          <div style={styles.errorText}>No history data found for this time range.</div>
        </div>
      );
    }

    return (
      <div style={styles.content}>
        <div style={styles.kpiRow}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Last Reading</div>
            <div style={styles.kpiValue}>
              {latestEntry
                ? new Date(latestEntry.timestamp).toLocaleString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                  })
                : '--'}
            </div>
          </div>
          
          <div style={styles.kpiCard}>
            <div style={styles.kpiLabel}>Active Alerts</div>
            <div style={styles.kpiValue}>{activeAlerts}</div>
          </div>
        </div>

        {METRICS.map((metric) => (
          <MetricChart
            key={metric.key}
            data={history}
            metric={metric}
            rangeKey={selectedRange}
            chartWidth={chartWidth}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          onClick={handleBack}
          style={styles.backButton}
        >
          <ArrowBackIcon style={styles.backButtonIcon} />
          <span style={styles.backButtonText}>Back</span>
        </button>
        <div>
          <div style={styles.headerTitle}>Historical Analytics</div>
          <div style={styles.headerSubtitle}>
            {device.device_name ?? device.device_id ?? 'Unknown Device'}
          </div>
        </div>
      </div>

      <div style={styles.rangeRow}>
        {Object.entries(RANGE_PRESETS).map(([key, preset]) => {
          const isActive = key === selectedRange;
          return (
            <button
              key={key}
              onClick={() => setSelectedRange(key)}
              style={{
                ...styles.rangeChip,
                ...(isActive ? styles.rangeChipActive : {})
              }}
            >
              <span style={{
                ...styles.rangeChipText,
                ...(isActive ? styles.rangeChipTextActive : {})
              }}>
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {renderContent()}
    </div>
  );
};

// --- STYLES (Unchanged) ---
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    padding: '20px',
    paddingBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#F5F6FA',
    borderBottom: '1px solid #E2E8F0',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  backButtonIcon: {
    fontSize: '20px',
    color: '#0F172A',
  },
  backButtonText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: '1.2',
  },
  headerSubtitle: {
    fontSize: '13px',
    color: '#475467',
    marginTop: '2px',
  },
  rangeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F5F6FA',
  },
  rangeChip: {
    borderRadius: '999px',
    padding: '8px 14px',
    backgroundColor: '#E2E8F0',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  rangeChipActive: {
    backgroundColor: '#2563EB',
  },
  rangeChipText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475467',
  },
  rangeChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: '20px',
    paddingBottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    height: '400px',
  },
  loadingText: {
    fontSize: '14px',
    color: '#475467',
  },
  errorText: {
    fontSize: '14px',
    color: '#B91C1C',
    textAlign: 'center',
    padding: '0 20px',
  },
  kpiRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: '1',
    minWidth: '120px',
    borderRadius: '16px',
    backgroundColor: '#FFFFFF',
    padding: '16px 18px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
  },
  kpiLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: '#64748B',
    marginBottom: '6px',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
  },
  metricCard: {
    borderRadius: '18px',
    backgroundColor: '#FFFFFF',
    padding: '18px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
  },
  metricHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  metricDelta: {
    fontSize: '13px',
    fontWeight: '600',
  },
  metricSummaryRow: {
    display: 'flex',
    gap: '12px',
  },
  metricSummaryItem: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '12px',
    backgroundColor: '#F8FAFC',
  },
  metricSummaryLabel: {
    fontSize: '11px',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    fontWeight: '600',
  },
  metricSummaryValue: {
    marginTop: '6px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1F2937',
  },
  chartCanvas: {
    width: '100%',
  },
  chartXAxisRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
  },
  chartXAxisLabel: {
    fontSize: '11px',
    color: '#64748B',
  },
  metricEmpty: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#64748B',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #2563EB',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Add CSS for spinner animation
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

export default IotAnalytics;