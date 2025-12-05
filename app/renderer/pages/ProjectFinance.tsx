import React, { useState, useEffect } from 'react';
import '../styles/coordinator.css';

interface LedgerRow {
  workstream: string;
  wbse: string;
  budget: number;
  forecast: number;
  actual: number;
  variance: number;
  variance_percent: number;
}

interface FinanceSummary {
  total_budget: number;
  total_forecast: number;
  total_actual: number;
  total_variance: number;
  total_variance_percent: number;
}

export const ProjectFinance: React.FC = () => {
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // Load finance data on mount
  useEffect(() => {
    loadFinanceData();
    loadAvailableMonths();
  }, [selectedMonth]);

  const loadFinanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load ledger data
      const ledgerData = await window.electronAPI.request('coordinator:finance:getLedger', { month: selectedMonth || undefined });
      setLedger(ledgerData || []);

      // Load summary data
      const summaryData = await window.electronAPI.request('coordinator:finance:getSummary', { month: selectedMonth || undefined });
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message || 'Failed to load finance data');
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableMonths = async () => {
    try {
      const months = await window.electronAPI.request('coordinator:finance:getAvailableMonths');
      setAvailableMonths(months || []);
    } catch (err: any) {
      console.error('Failed to load available months:', err);
    }
  };

  // Format currency
  const formatNZD = (value: number): string => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get variance color based on value
  const getVarianceColor = (variance: number): string => {
    if (variance < 0) return '#22863a'; // Under budget (good) - green
    if (variance > 0) return '#dc3545'; // Over budget (bad) - red
    return '#718096'; // Neutral - gray
  };

  // Get variance class
  const getVarianceClass = (variance: number): string => {
    if (variance < 0) return 'variance-positive';
    if (variance > 0) return 'variance-negative';
    return 'variance-neutral';
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Format month display
  const formatMonth = (month: string): string => {
    if (!month) return 'All Time';
    try {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      return date.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
    } catch {
      return month;
    }
  };

  if (isLoading) {
    return (
      <div className="project-finance">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-finance">
      <div className="finance-header">
        <div>
          <h1>Project Finance Overview</h1>
          <p className="subtitle">Budget, forecast, and actual costs by workstream</p>
        </div>

        {/* Month Filter */}
        {availableMonths.length > 0 && (
          <div className="month-filter">
            <label>Period:</label>
            <select 
              className="select-input"
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">All Time</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="info-box">
        <strong>💰 How to read this:</strong>
        <ul>
          <li><strong>Budget:</strong> Original planned budget from financial planning</li>
          <li><strong>Forecast:</strong> Calculated from allocated hours × labour rates</li>
          <li><strong>Actual:</strong> Real costs from SAP actuals imports</li>
          <li><strong>Variance:</strong> Difference between actual and forecast (negative = under budget)</li>
        </ul>
      </div>

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="finance-summary">
          <div className="card">
            <h3>Budget</h3>
            <p className="amount">{formatNZD(summary.total_budget)}</p>
            <span className="card-subtitle">Original planned</span>
          </div>
          <div className="card">
            <h3>Forecast</h3>
            <p className="amount">{formatNZD(summary.total_forecast)}</p>
            <span className="card-subtitle">Allocated resources</span>
          </div>
          <div className="card">
            <h3>Actual YTD</h3>
            <p className="amount">{formatNZD(summary.total_actual)}</p>
            <span className="card-subtitle">From SAP</span>
          </div>
          <div className="card">
            <h3>Variance</h3>
            <p 
              className="amount" 
              style={{ color: getVarianceColor(summary.total_variance) }}
            >
              {formatNZD(summary.total_variance)}
            </p>
            <span 
              className="card-subtitle"
              style={{ color: getVarianceColor(summary.total_variance) }}
            >
              {formatPercent(summary.total_variance_percent)}
            </span>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      {ledger.length === 0 ? (
        <div className="empty-state">
          <p>
            ✨ No financial data available. Import actuals and create allocations to see the ledger.
          </p>
        </div>
      ) : (
        <div className="finance-table-wrapper">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Workstream</th>
                <th>WBSE</th>
                <th>Budget</th>
                <th>Forecast</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row, index) => (
                <tr key={index}>
                  <td className="workstream-name">{row.workstream}</td>
                  <td className="wbse-code">{row.wbse}</td>
                  <td className="amount-cell">{formatNZD(row.budget)}</td>
                  <td className="amount-cell">{formatNZD(row.forecast)}</td>
                  <td className="amount-cell">{formatNZD(row.actual)}</td>
                  <td 
                    className={`amount-cell ${getVarianceClass(row.variance)}`}
                  >
                    {formatNZD(row.variance)}
                  </td>
                  <td 
                    className={`percent-cell ${getVarianceClass(row.variance)}`}
                  >
                    {formatPercent(row.variance_percent)}
                  </td>
                </tr>
              ))}
              
              {/* Total Row */}
              {summary && (
                <tr className="total-row">
                  <td colSpan={2}><strong>TOTAL</strong></td>
                  <td className="amount-cell"><strong>{formatNZD(summary.total_budget)}</strong></td>
                  <td className="amount-cell"><strong>{formatNZD(summary.total_forecast)}</strong></td>
                  <td className="amount-cell"><strong>{formatNZD(summary.total_actual)}</strong></td>
                  <td 
                    className={`amount-cell ${getVarianceClass(summary.total_variance)}`}
                  >
                    <strong>{formatNZD(summary.total_variance)}</strong>
                  </td>
                  <td 
                    className={`percent-cell ${getVarianceClass(summary.total_variance)}`}
                  >
                    <strong>{formatPercent(summary.total_variance_percent)}</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="finance-legend">
        <div className="legend-item">
          <span className="legend-color variance-positive"></span>
          <span>Under Forecast (Positive)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color variance-negative"></span>
          <span>Over Forecast (Negative)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color variance-neutral"></span>
          <span>On Track</span>
        </div>
      </div>
    </div>
  );
};
