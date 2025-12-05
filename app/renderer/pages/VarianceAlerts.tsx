import React, { useState, useEffect } from 'react';
import '../styles/coordinator.css';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_type: string;
  entity_id: string;
  message: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export const VarianceAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await window.electronAPI.request('coordinator:alerts:list');
      setAlerts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...alerts];

    // Filter by severity
    if (severityFilter) {
      filtered = filtered.filter(a => a.severity === severityFilter);
    }

    // Filter by type
    if (typeFilter) {
      filtered = filtered.filter(a => a.alert_type === typeFilter);
    }

    // Filter by acknowledged status
    if (!showAcknowledged) {
      filtered = filtered.filter(a => !a.acknowledged);
    }

    setFilteredAlerts(filtered);
  }, [alerts, severityFilter, typeFilter, showAcknowledged]);

  // Handle acknowledge
  const handleAcknowledge = async (alertId: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await window.electronAPI.request('coordinator:alerts:acknowledge', alertId);
      setSuccessMessage('Alert acknowledged successfully');
      // Reload alerts
      await loadAlerts();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to acknowledge alert');
    }
  };

  // Severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  // Get unique alert types from current alerts
  const alertTypes = Array.from(new Set(alerts.map(a => a.alert_type))).sort();

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NZ', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format alert type for display
  const formatAlertType = (type: string): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="variance-alerts">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="variance-alerts">
      <div className="alerts-header">
        <h1>Variance Alerts</h1>
        <p className="subtitle">Monitor and acknowledge project variances</p>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <strong>📊 How it works:</strong>
        <ul>
          <li>Alerts are generated automatically when variances are detected</li>
          <li>Filter by severity or type to focus on specific issues</li>
          <li>Click "Acknowledge" to mark alerts as reviewed</li>
          <li>Use the toggle to show/hide acknowledged alerts</li>
        </ul>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success">
          ✅ {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Severity</label>
          <select 
            className="select-input"
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <select 
            className="select-input"
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {alertTypes.map((type) => (
              <option key={type} value={type}>
                {formatAlertType(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group checkbox-filter">
          <label>
            <input 
              type="checkbox" 
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
            />
            <span>Show Acknowledged</span>
          </label>
        </div>

        <div className="filter-stats">
          <span>Found: <strong>{filteredAlerts.length}</strong> of <strong>{alerts.length}</strong> alerts</span>
        </div>
      </div>

      {/* Alerts Table */}
      {filteredAlerts.length === 0 ? (
        <div className="empty-state">
          <p>
            {alerts.length === 0 
              ? '✨ No alerts found. Your project is running smoothly!'
              : '🔍 No alerts match your current filters. Try adjusting the filters above.'}
          </p>
        </div>
      ) : (
        <div className="alerts-table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Type</th>
                <th>Message</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => (
                <tr 
                  key={alert.id}
                  className={alert.acknowledged ? 'acknowledged' : ''}
                  style={{
                    borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                  }}
                >
                  <td>
                    <span 
                      className="severity-badge"
                      style={{ 
                        backgroundColor: getSeverityColor(alert.severity),
                        color: 'white'
                      }}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="alert-type">{formatAlertType(alert.alert_type)}</td>
                  <td className="alert-message">{alert.message}</td>
                  <td className="alert-date">{formatDate(alert.created_at)}</td>
                  <td className="alert-action">
                    {!alert.acknowledged ? (
                      <button 
                        onClick={() => handleAcknowledge(alert.id)}
                        className="btn-acknowledge"
                      >
                        ✓ Acknowledge
                      </button>
                    ) : (
                      <span className="acknowledged-text">
                        ✓ Acknowledged
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {alerts.length > 0 && (
        <div className="alerts-summary">
          <div className="summary-stat">
            <span className="stat-label">Total Alerts:</span>
            <span className="stat-value">{alerts.length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Unacknowledged:</span>
            <span className="stat-value critical">{alerts.filter(a => !a.acknowledged).length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Critical:</span>
            <span className="stat-value critical">{alerts.filter(a => a.severity === 'critical').length}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">High:</span>
            <span className="stat-value high">{alerts.filter(a => a.severity === 'high').length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
