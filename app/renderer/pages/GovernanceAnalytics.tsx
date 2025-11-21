/**
 * Governance Analytics - Portfolio heatmap, trends, and analytics
 */

import React, { useEffect, useState } from 'react';
import { useGovernanceStore } from '../stores/governanceStore';

export const GovernanceAnalytics: React.FC = () => {
  const {
    heatmapData,
    healthTrend,
    gateAnalytics,
    complianceAnalytics,
    filters,
    loading,
    error,
    generateHeatmap,
    fetchHealthTrend,
    fetchGateAnalytics,
    fetchComplianceAnalytics,
    setFilters,
    clearFilters,
    clearError
  } = useGovernanceStore();

  const [trendDays, setTrendDays] = useState(90);

  useEffect(() => {
    generateHeatmap(filters);
    fetchHealthTrend(trendDays);
    fetchGateAnalytics();
    fetchComplianceAnalytics();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value });
    generateHeatmap({ ...filters, [key]: value });
  };

  const handleTrendDaysChange = (days: number) => {
    setTrendDays(days);
    fetchHealthTrend(days);
  };

  if (loading.analytics) {
    return (
      <div className="governance-analytics loading">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="governance-analytics">
      <div className="analytics-header">
        <h1>Portfolio Analytics</h1>
        <div className="filter-controls">
          <select onChange={(e) => handleFilterChange('status', e.target.value)} value={filters.status || ''}>
            <option value="">All Status</option>
            <option value="on-track">On Track</option>
            <option value="at-risk">At Risk</option>
            <option value="blocked">Blocked</option>
            <option value="escalated">Escalated</option>
          </select>
          <button onClick={clearFilters}>Clear Filters</button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      {/* Portfolio Heatmap */}
      <section className="heatmap-section">
        <h2>Portfolio Risk vs Value Heatmap</h2>
        {heatmapData && heatmapData.length > 0 ? (
          <div className="heatmap-container">
            <svg width="800" height="600" className="heatmap-svg">
              {/* Y-axis (Value) */}
              <line x1="50" y1="50" x2="50" y2="550" stroke="#666" strokeWidth="2" />
              <text x="20" y="300" transform="rotate(-90, 20, 300)" textAnchor="middle">Value Score</text>
              
              {/* X-axis (Risk) */}
              <line x1="50" y1="550" x2="750" y2="550" stroke="#666" strokeWidth="2" />
              <text x="400" y="580" textAnchor="middle">Risk Score</text>
              
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(val => (
                <g key={val}>
                  <line x1="50" y1={550 - val * 5} x2="750" y2={550 - val * 5} stroke="#e0e0e0" strokeWidth="1" />
                  <line x1={50 + val * 7} y1="50" x2={50 + val * 7} y2="550" stroke="#e0e0e0" strokeWidth="1" />
                  <text x="30" y={555 - val * 5} fontSize="10" textAnchor="end">{val}</text>
                  <text x={50 + val * 7} y="565" fontSize="10" textAnchor="middle">{val}</text>
                </g>
              ))}
              
              {/* Data points */}
              {heatmapData.map((project, idx) => {
                const x = 50 + (project.riskScore * 7);
                const y = 550 - (project.valueScore * 5);
                const colorMap: Record<string, string> = {
                  'on-track': '#4CAF50',
                  'at-risk': '#FFC107',
                  'blocked': '#F44336',
                  'escalated': '#9C27B0'
                };
                const color = colorMap[project.status] || '#666';
                
                return (
                  <g key={idx}>
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill={color}
                      opacity="0.7"
                      title={project.projectName}
                    />
                    <text x={x} y={y - 15} fontSize="9" textAnchor="middle" fill="#333">
                      {project.projectName.substring(0, 15)}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="heatmap-legend">
              <div className="legend-item"><span className="dot on-track"></span> On Track</div>
              <div className="legend-item"><span className="dot at-risk"></span> At Risk</div>
              <div className="legend-item"><span className="dot blocked"></span> Blocked</div>
              <div className="legend-item"><span className="dot escalated"></span> Escalated</div>
            </div>
          </div>
        ) : (
          <p className="no-data">No heatmap data available</p>
        )}
      </section>

      {/* Health Trend */}
      <section className="health-trend-section">
        <h2>Portfolio Health Trend</h2>
        <div className="trend-controls">
          <button onClick={() => handleTrendDaysChange(30)} className={trendDays === 30 ? 'active' : ''}>30 Days</button>
          <button onClick={() => handleTrendDaysChange(90)} className={trendDays === 90 ? 'active' : ''}>90 Days</button>
          <button onClick={() => handleTrendDaysChange(180)} className={trendDays === 180 ? 'active' : ''}>180 Days</button>
        </div>
        {healthTrend && healthTrend.length > 0 ? (
          <div className="trend-chart">
            <svg width="800" height="300" className="trend-svg">
              <line x1="50" y1="250" x2="750" y2="250" stroke="#666" strokeWidth="2" />
              <line x1="50" y1="50" x2="50" y2="250" stroke="#666" strokeWidth="2" />
              
              {/* Trend line */}
              <polyline
                points={healthTrend.map((point, idx) => {
                  const x = 50 + (idx / (healthTrend.length - 1)) * 700;
                  const y = 250 - (point.value * 2);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#2196F3"
                strokeWidth="3"
              />
              
              {/* Data points */}
              {healthTrend.map((point, idx) => {
                const x = 50 + (idx / (healthTrend.length - 1)) * 700;
                const y = 250 - (point.value * 2);
                return (
                  <circle key={idx} cx={x} cy={y} r="4" fill="#2196F3" />
                );
              })}
            </svg>
          </div>
        ) : (
          <p className="no-data">No trend data available</p>
        )}
      </section>

      <div className="analytics-grid">
        {/* Gate Analytics */}
        <section className="gate-analytics-section">
          <h2>Gate Progression Analytics</h2>
          {gateAnalytics ? (
            <>
              <div className="average-days">
                <h3>Average Days per Gate</h3>
                {Object.entries(gateAnalytics.averageDaysPerGate).map(([gate, days]) => (
                  <div key={gate} className="gate-stat">
                    <span>{gate}</span>
                    <span>{days} days</span>
                  </div>
                ))}
              </div>
              {gateAnalytics.stuckProjects.length > 0 && (
                <div className="stuck-projects">
                  <h3>Stuck Projects (60+ days)</h3>
                  {gateAnalytics.stuckProjects.map((proj: any, idx: number) => (
                    <div key={idx} className="stuck-project">
                      <span>{proj.projectName}</span>
                      <span>{proj.daysInGate} days</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="no-data">No gate analytics available</p>
          )}
        </section>

        {/* Compliance Analytics */}
        <section className="compliance-analytics-section">
          <h2>Compliance Analytics</h2>
          {complianceAnalytics ? (
            <>
              <div className="compliance-rate">
                <div className="rate-value">{complianceAnalytics.complianceRate}%</div>
                <div className="rate-label">Overall Compliance Rate</div>
              </div>
              <div className="by-policy">
                <h3>By Policy</h3>
                {Object.entries(complianceAnalytics.byPolicy).map(([policy, data]: [string, any]) => (
                  <div key={policy} className="policy-stat">
                    <span>{policy}</span>
                    <span>{data.rate}%</span>
                  </div>
                ))}
              </div>
              {complianceAnalytics.topViolators.length > 0 && (
                <div className="top-violators">
                  <h3>Top Violators</h3>
                  {complianceAnalytics.topViolators.map((violator: any, idx: number) => (
                    <div key={idx} className="violator">
                      <span>{violator.projectName}</span>
                      <span>{violator.violations} violations</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="no-data">No compliance analytics available</p>
          )}
        </section>
      </div>
    </div>
  );
};
