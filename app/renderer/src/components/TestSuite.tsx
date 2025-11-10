import React, { useState, useEffect } from 'react';

interface TestResult {
  id: string;
  name: string;
  type: 'security' | 'integration' | 'performance' | 'unit' | 'e2e';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  startTime?: string;
  endTime?: string;
  passCount?: number;
  failCount?: number;
  skipCount?: number;
  totalCount?: number;
  logFile?: string;
  errors?: string[];
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  status: 'idle' | 'running' | 'completed';
  totalDuration?: number;
  logFile?: string;
}

const TestSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tests' | 'data'>('tests');
  const [selectedSuite, setSelectedSuite] = useState<string>('all');
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [dataStats, setDataStats] = useState<any>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [clearResults, setClearResults] = useState<Array<{module: string, success: boolean, deletedRecords?: number, error?: string}>>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'security',
      name: 'Security Tests',
      description: 'Authentication, authorization, and security vulnerability tests',
      status: 'idle',
      tests: [
        {
          id: 'sec-001',
          name: 'Authentication Tests',
          type: 'security',
          status: 'pending',
          totalCount: 12,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'sec-002',
          name: 'Authorization Tests',
          type: 'security',
          status: 'pending',
          totalCount: 8,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'sec-003',
          name: 'SQL Injection Tests',
          type: 'security',
          status: 'pending',
          totalCount: 15,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        }
      ]
    },
    {
      id: 'integration',
      name: 'Integration Tests',
      description: 'API endpoints, database operations, and service integrations',
      status: 'idle',
      tests: [
        {
          id: 'int-001',
          name: 'Database Operations',
          type: 'integration',
          status: 'pending',
          totalCount: 25,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'int-002',
          name: 'ADO Integration',
          type: 'integration',
          status: 'pending',
          totalCount: 18,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'int-003',
          name: 'File System Operations',
          type: 'integration',
          status: 'pending',
          totalCount: 10,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        }
      ]
    },
    {
      id: 'performance',
      name: 'Performance Tests',
      description: 'Load testing, memory usage, and response time validation',
      status: 'idle',
      tests: [
        {
          id: 'perf-001',
          name: 'Database Query Performance',
          type: 'performance',
          status: 'pending',
          totalCount: 8,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'perf-002',
          name: 'Memory Usage Tests',
          type: 'performance',
          status: 'pending',
          totalCount: 6,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'perf-003',
          name: 'Load Testing',
          type: 'performance',
          status: 'pending',
          totalCount: 12,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        }
      ]
    },
    {
      id: 'unit',
      name: 'Unit Tests',
      description: 'Individual component and function testing',
      status: 'idle',
      tests: [
        {
          id: 'unit-001',
          name: 'Component Tests',
          type: 'unit',
          status: 'pending',
          totalCount: 45,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'unit-002',
          name: 'Utility Function Tests',
          type: 'unit',
          status: 'pending',
          totalCount: 32,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'unit-003',
          name: 'Store Tests',
          type: 'unit',
          status: 'pending',
          totalCount: 28,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        }
      ]
    },
    {
      id: 'e2e',
      name: 'End-to-End Tests',
      description: 'Full application workflow and user journey testing',
      status: 'idle',
      tests: [
        {
          id: 'e2e-001',
          name: 'Project Management Flow',
          type: 'e2e',
          status: 'pending',
          totalCount: 15,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'e2e-002',
          name: 'Epic & Feature Workflow',
          type: 'e2e',
          status: 'pending',
          totalCount: 12,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        },
        {
          id: 'e2e-003',
          name: 'Dashboard Navigation',
          type: 'e2e',
          status: 'pending',
          totalCount: 8,
          passCount: 0,
          failCount: 0,
          skipCount: 0
        }
      ]
    }
  ]);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logFiles, setLogFiles] = useState<string[]>([]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      case 'skipped': return '⏭️';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'running': return '#f59e0b';
      case 'skipped': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const runTestSuite = async (suiteId: string) => {
    if (isRunning) return;
    
    setIsRunning(true);
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    // Update suite status
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId ? { ...s, status: 'running' } : s
    ));

    // Simulate running tests
    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      
      // Mark test as running
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id 
                  ? { ...t, status: 'running', startTime: new Date().toISOString() }
                  : t
              )
            }
          : s
      ));

      // Simulate test execution time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Simulate test results
      const passed = Math.random() > 0.2; // 80% pass rate
      const duration = Math.floor(1000 + Math.random() * 4000);
      const failCount = passed ? 0 : Math.floor(Math.random() * (test.totalCount || 0) / 3);
      const passCount = (test.totalCount || 0) - failCount;
      
      const logFile = `logs/test-${suiteId}-${test.id}-${Date.now()}.log`;
      const errors = passed ? [] : [
        `AssertionError: Expected true but received false at test line 42`,
        `TypeError: Cannot read property 'data' of undefined`,
        `NetworkError: Request failed with status 500`
      ];

      // Update test results
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? {
              ...s,
              tests: s.tests.map(t => 
                t.id === test.id 
                  ? {
                      ...t,
                      status: passed ? 'passed' : 'failed',
                      duration,
                      endTime: new Date().toISOString(),
                      passCount,
                      failCount,
                      skipCount: 0,
                      logFile,
                      errors
                    }
                  : t
              )
            }
          : s
      ));

      if (!passed) {
        setLogFiles(prev => [...prev, logFile]);
      }
    }

    // Mark suite as completed
    setTestSuites(prev => prev.map(s => 
      s.id === suiteId 
        ? { 
            ...s, 
            status: 'completed',
            totalDuration: s.tests.reduce((acc, t) => acc + (t.duration || 0), 0),
            logFile: `logs/suite-${suiteId}-${Date.now()}.log`
          }
        : s
    ));

    setIsRunning(false);
  };

  const runAllTests = async () => {
    for (const suite of testSuites) {
      await runTestSuite(suite.id);
    }
  };

  const clearTestResults = () => {
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      status: 'idle',
      totalDuration: undefined,
      logFile: undefined,
      tests: suite.tests.map(test => ({
        ...test,
        status: 'pending',
        duration: undefined,
        startTime: undefined,
        endTime: undefined,
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        logFile: undefined,
        errors: undefined
      }))
    })));
    setSelectedTest(null);
    setLogFiles([]);
  };

  const loadDataStats = async () => {
    try {
      const result = await (window as any).electronAPI.getDataStats();
      if (result.success) {
        setDataStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to load data stats:', error);
    }
  };

  const clearModuleData = async (moduleName: string) => {
    if (!confirm(`Are you sure you want to clear all data from the ${moduleName} module? This action cannot be undone.`)) {
      return;
    }

    setIsClearing(true);
    try {
      const result = await (window as any).electronAPI.clearModuleData(moduleName);
      setClearResults(prev => [...prev, {
        module: moduleName,
        success: result.success,
        deletedRecords: result.deletedRecords,
        error: result.error
      }]);
      
      // Reload stats after clearing
      await loadDataStats();
    } catch (error: any) {
      setClearResults(prev => [...prev, {
        module: moduleName,
        success: false,
        error: error.message
      }]);
    } finally {
      setIsClearing(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL data from ALL modules! This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    setIsClearing(true);
    setClearResults([]);
    try {
      const result = await (window as any).electronAPI.clearModuleData('all');
      setClearResults([{
        module: 'all',
        success: result.success,
        deletedRecords: result.deletedRecords,
        error: result.error
      }]);
      
      // Reload stats after clearing
      await loadDataStats();
    } catch (error: any) {
      setClearResults([{
        module: 'all',
        success: false,
        error: error.message
      }]);
    } finally {
      setIsClearing(false);
    }
  };

  // Load data stats when switching to data tab
  useEffect(() => {
    if (activeTab === 'data') {
      loadDataStats();
    }
  }, [activeTab]);

  const filteredSuites = selectedSuite === 'all' 
    ? testSuites 
    : testSuites.filter(s => s.id === selectedSuite);

  const allTests = testSuites.flatMap(s => s.tests);
  const overallStats = {
    total: allTests.length,
    passed: allTests.filter(t => t.status === 'passed').length,
    failed: allTests.filter(t => t.status === 'failed').length,
    running: allTests.filter(t => t.status === 'running').length,
    pending: allTests.filter(t => t.status === 'pending').length
  };

  return (
    <div className="app-panel">
      <div className="test-suite">
        <div className="test-suite-header">
        <div className="header-left">
          <h2>Test Suite</h2>
          <div className="test-tabs">
            <button 
              className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`}
              onClick={() => setActiveTab('tests')}
            >
              🧪 Test Runner
            </button>
            <button 
              className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              🗑️ Data Management
            </button>
          </div>
          {activeTab === 'tests' && (
          <div className="test-controls">
            <select 
              value={selectedSuite} 
              onChange={(e) => setSelectedSuite(e.target.value)}
              disabled={isRunning}
            >
              <option value="all">All Test Suites</option>
              {testSuites.map(suite => (
                <option key={suite.id} value={suite.id}>{suite.name}</option>
              ))}
            </select>
            
            <button 
              onClick={runAllTests}
              disabled={isRunning}
              className="btn btn-primary"
            >
              {isRunning ? 'Running...' : 'Run All Tests'}
            </button>
            
            <button 
              onClick={() => selectedSuite === 'all' ? runAllTests() : runTestSuite(selectedSuite)}
              disabled={isRunning || selectedSuite === 'all'}
              className="btn btn-secondary"
            >
              Run Selected
            </button>
            
            <button 
              onClick={clearTestResults}
              disabled={isRunning}
              className="btn btn-outline"
            >
              Clear Results
            </button>
            
            <button 
              onClick={() => {
                // Open CSS demo in new window
                const demoWindow = window.open('css-demo.html', 'css-demo', 'width=1400,height=900,scrollbars=yes,resizable=yes');
                if (demoWindow) {
                  demoWindow.focus();
                }
              }}
              className="btn btn-outline"
              title="View CSS styles comparison demo"
            >
              🎨 CSS Demo
            </button>
          </div>
          )}
        </div>
        
        {activeTab === 'tests' && (
        <div className="test-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{overallStats.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Passed:</span>
            <span className="stat-value passed">{overallStats.passed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Failed:</span>
            <span className="stat-value failed">{overallStats.failed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Running:</span>
            <span className="stat-value running">{overallStats.running}</span>
          </div>
        </div>
        )}
      </div>

      {activeTab === 'tests' && (
      <div className="test-suite-content">
        {/* Left Panel - Test Cards */}
        <div className="test-panel-left">
          <div className="test-suites-list">
            {filteredSuites.map(suite => (
              <div key={suite.id} className="test-suite-card">
                <div className="suite-header">
                  <h3>{suite.name}</h3>
                  <div className="suite-status">
                    <span className={`status-badge ${suite.status}`}>
                      {suite.status === 'running' ? '⏳' : suite.status === 'completed' ? '✅' : '⚪'}
                      {suite.status}
                    </span>
                    {suite.totalDuration && (
                      <span className="duration">{(suite.totalDuration / 1000).toFixed(2)}s</span>
                    )}
                  </div>
                </div>
                
                <p className="suite-description">{suite.description}</p>
                
                <div className="tests-list">
                  {suite.tests.map(test => (
                    <div 
                      key={test.id} 
                      className={`test-card ${selectedTest?.id === test.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTest(test)}
                    >
                      <div className="test-header">
                        <span className="test-icon" style={{ color: getStatusColor(test.status) }}>
                          {getStatusIcon(test.status)}
                        </span>
                        <span className="test-name">{test.name}</span>
                        {test.duration && (
                          <span className="test-duration">{(test.duration / 1000).toFixed(2)}s</span>
                        )}
                      </div>
                      
                      {test.totalCount && (
                        <div className="test-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-passed" 
                              style={{ 
                                width: `${((test.passCount || 0) / test.totalCount) * 100}%` 
                              }}
                            />
                            <div 
                              className="progress-failed" 
                              style={{ 
                                width: `${((test.failCount || 0) / test.totalCount) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="progress-text">
                            {test.passCount || 0}/{test.totalCount} passed
                            {(test.failCount || 0) > 0 && `, ${test.failCount} failed`}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {suite.status !== 'idle' && (
                  <div className="suite-actions">
                    <button 
                      onClick={() => runTestSuite(suite.id)}
                      disabled={isRunning}
                      className="btn btn-sm btn-secondary"
                    >
                      Re-run Suite
                    </button>
                    {suite.logFile && (
                      <button className="btn btn-sm btn-outline">
                        View Log
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Error Output */}
        <div className="test-panel-right">
          <div className="error-panel">
            <div className="error-header">
              <h3>Test Output</h3>
              {logFiles.length > 0 && (
                <div className="log-file-info">
                  <span className="log-count">{logFiles.length} log file(s) generated</span>
                  <span className="log-location">Location: ./logs/</span>
                </div>
              )}
            </div>
            
            {selectedTest ? (
              <div className="test-details">
                <div className="test-info">
                  <h4>{selectedTest.name}</h4>
                  <div className="test-metadata">
                    <div className="metadata-row">
                      <span>Status:</span>
                      <span className={`status ${selectedTest.status}`}>
                        {getStatusIcon(selectedTest.status)} {selectedTest.status}
                      </span>
                    </div>
                    <div className="metadata-row">
                      <span>Type:</span>
                      <span>{selectedTest.type}</span>
                    </div>
                    {selectedTest.duration && (
                      <div className="metadata-row">
                        <span>Duration:</span>
                        <span>{(selectedTest.duration / 1000).toFixed(2)}s</span>
                      </div>
                    )}
                    {selectedTest.startTime && (
                      <div className="metadata-row">
                        <span>Started:</span>
                        <span>{new Date(selectedTest.startTime).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {selectedTest.logFile && (
                      <div className="metadata-row">
                        <span>Log File:</span>
                        <span className="log-file-path">{selectedTest.logFile}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedTest.errors && selectedTest.errors.length > 0 && (
                  <div className="error-output">
                    <h5>Error Details:</h5>
                    <div className="error-list">
                      {selectedTest.errors.map((error, index) => (
                        <div key={index} className="error-item">
                          <div className="error-index">{index + 1}.</div>
                          <div className="error-message">{error}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedTest.status === 'passed' && (
                  <div className="success-message">
                    <span className="success-icon">✅</span>
                    All tests passed successfully!
                  </div>
                )}
              </div>
            ) : (
              <div className="no-selection">
                <p>Select a test from the left panel to view detailed output and errors.</p>
                {logFiles.length > 0 && (
                  <div className="recent-logs">
                    <h4>Recent Log Files:</h4>
                    <ul>
                      {logFiles.slice(-5).map((logFile, index) => (
                        <li key={index} className="log-file-item">
                          {logFile}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {activeTab === 'data' && (
        <div className="data-management-content">
          <div className="data-management-panel">
            <div className="panel-section">
              <h3>Database Statistics</h3>
              {dataStats ? (
                <div className="data-stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Projects</div>
                    <div className="stat-value">{dataStats.projects.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Epics</div>
                    <div className="stat-value">{dataStats.epics.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Features</div>
                    <div className="stat-value">{dataStats.features.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Tasks</div>
                    <div className="stat-value">{dataStats.tasks.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Dependencies</div>
                    <div className="stat-value">{dataStats.dependencies.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Calendar Years</div>
                    <div className="stat-value">{dataStats.calendar_years.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Public Holidays</div>
                    <div className="stat-value">{dataStats.public_holidays.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">ADO Configs</div>
                    <div className="stat-value">{dataStats.ado_config.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">ADO Tags</div>
                    <div className="stat-value">{dataStats.ado_tags.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Financial Resources</div>
                    <div className="stat-value">{dataStats.financial_resources.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Feature Allocations</div>
                    <div className="stat-value">{dataStats.feature_allocations.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Project Gates</div>
                    <div className="stat-value">{dataStats.project_gates.count}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Audit Events</div>
                    <div className="stat-value">{dataStats.audit_events.count}</div>
                  </div>
                </div>
              ) : (
                <div className="loading">Loading statistics...</div>
              )}
              <button 
                onClick={loadDataStats}
                className="btn btn-secondary"
                style={{ marginTop: '16px' }}
              >
                🔄 Refresh Stats
              </button>
            </div>

            <div className="panel-section">
              <h3>Clear Sample Data by Module</h3>
              <p className="warning-text">
                ⚠️ Warning: These actions will permanently delete data from the database and cannot be undone.
              </p>
              <div className="module-actions">
                <button 
                  onClick={() => clearModuleData('projects')}
                  disabled={isClearing}
                  className="btn btn-danger"
                >
                  Clear Projects Module
                </button>
                <button 
                  onClick={() => clearModuleData('calendar')}
                  disabled={isClearing}
                  className="btn btn-danger"
                >
                  Clear Calendar Module
                </button>
                <button 
                  onClick={() => clearModuleData('ado')}
                  disabled={isClearing}
                  className="btn btn-danger"
                >
                  Clear ADO Integration
                </button>
                <button 
                  onClick={() => clearModuleData('financial')}
                  disabled={isClearing}
                  className="btn btn-danger"
                >
                  Clear Financial Coordinator
                </button>
                <button 
                  onClick={() => clearModuleData('governance')}
                  disabled={isClearing}
                  className="btn btn-danger"
                >
                  Clear Governance Module
                </button>
                <button 
                  onClick={() => clearModuleData('dependencies')}
                  disabled={isClearing}
                  className="btn btn-danger"
                >
                  Clear Dependencies
                </button>
                <button 
                  onClick={() => clearModuleData('audit')}
                  disabled={isClearing}
                  className="btn btn-danger"
                >
                  Clear Audit Events
                </button>
              </div>
              <div className="danger-zone">
                <h4>🚨 Danger Zone</h4>
                <button 
                  onClick={clearAllData}
                  disabled={isClearing}
                  className="btn btn-danger-alt"
                >
                  💣 Clear ALL Data from ALL Modules
                </button>
              </div>
            </div>

            {clearResults.length > 0 && (
              <div className="panel-section">
                <h3>Clear Operations Results</h3>
                <div className="clear-results">
                  {clearResults.map((result, index) => (
                    <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                      <div className="result-icon">{result.success ? '✅' : '❌'}</div>
                      <div className="result-details">
                        <div className="result-module"><strong>{result.module}</strong></div>
                        {result.success ? (
                          <div className="result-message">
                            Successfully cleared {result.deletedRecords} record(s)
                          </div>
                        ) : (
                          <div className="result-error">
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setClearResults([])}
                  className="btn btn-outline"
                  style={{ marginTop: '12px' }}
                >
                  Clear Results
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default TestSuite;