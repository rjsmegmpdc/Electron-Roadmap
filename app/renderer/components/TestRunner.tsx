import React, { useState, useEffect, useRef } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
  output?: string[];
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  icon: string;
  color: string;
  estimatedDuration: number;
}

interface TestRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEST_SUITES: TestSuite[] = [
  {
    id: 'security',
    name: 'Security Tests',
    description: 'Unit tests for EncryptionService and TokenManager',
    command: 'npm',
    args: ['run', 'test:security'],
    icon: '🔒',
    color: '#e91e63',
    estimatedDuration: 30
  },
  {
    id: 'integration',
    name: 'Integration Tests',
    description: 'End-to-end workflow and database integration tests',
    command: 'npm',
    args: ['run', 'test:integration'],
    icon: '🔗',
    color: '#2196f3',
    estimatedDuration: 60
  },
  {
    id: 'performance',
    name: 'Performance Tests',
    description: 'Benchmarks, stress tests, and memory profiling',
    command: 'npm',
    args: ['run', 'test:performance'],
    icon: '⚡',
    color: '#ff9800',
    estimatedDuration: 300
  },
  {
    id: 'all',
    name: 'Complete Test Suite',
    description: 'Run all tests in optimized sequence',
    command: 'npm',
    args: ['run', 'test:runner'],
    icon: '🧪',
    color: '#4caf50',
    estimatedDuration: 400
  }
];

export function TestRunner({ isOpen, onClose }: TestRunnerProps) {
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [showOutput, setShowOutput] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Debug logging state
  const [debugConfig, setDebugConfig] = useState<any>(null);
  const [debugLogFiles, setDebugLogFiles] = useState<any[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogContent, setDebugLogContent] = useState<string>('');

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [testResults, showOutput]);
  
  // Load debug config when component mounts
  useEffect(() => {
    loadDebugConfig();
  }, []);
  
  // Debug logging functions
  const loadDebugConfig = async () => {
    try {
      const result = await window.electronAPI.debugGetConfig();
      if (result.success) {
        setDebugConfig(result.config);
      }
    } catch (error) {
      console.error('Failed to load debug config:', error);
    }
  };
  
  const toggleDebugLogging = async () => {
    if (!debugConfig) return;
    
    try {
      const newEnabled = !debugConfig.enabled;
      const result = await window.electronAPI.debugSetEnabled(newEnabled);
      if (result.success) {
        setDebugConfig({ ...debugConfig, enabled: newEnabled });
      }
    } catch (error) {
      console.error('Failed to toggle debug logging:', error);
    }
  };
  
  const loadDebugLogFiles = async () => {
    try {
      const result = await window.electronAPI.debugGetLogFiles();
      if (result.success) {
        setDebugLogFiles(result.files || []);
      }
    } catch (error) {
      console.error('Failed to load debug log files:', error);
    }
  };
  
  const viewDebugLogFile = async (filePath: string) => {
    try {
      const result = await window.electronAPI.debugReadLogFile(filePath, 500);
      if (result.success && result.entries) {
        const content = result.entries
          .map((entry: any) => `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`)
          .join('\n');
        setDebugLogContent(content);
      }
    } catch (error) {
      console.error('Failed to read debug log file:', error);
    }
  };
  
  const clearDebugLogs = async () => {
    if (!confirm('Are you sure you want to clear all debug logs? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await window.electronAPI.debugClearLogs();
      if (result.success) {
        setDebugLogFiles([]);
        setDebugLogContent('');
        alert('Debug logs cleared successfully');
      }
    } catch (error) {
      console.error('Failed to clear debug logs:', error);
      alert('Failed to clear debug logs');
    }
  };

  const updateTestResult = (testId: string, updates: Partial<TestResult>) => {
    setTestResults(prev => {
      const newResults = new Map(prev);
      const existing = newResults.get(testId) || { name: '', status: 'pending' };
      newResults.set(testId, { ...existing, ...updates });
      return newResults;
    });
  };

  const addOutput = (testId: string, line: string) => {
    setTestResults(prev => {
      const newResults = new Map(prev);
      const existing = newResults.get(testId) || { name: '', status: 'pending', output: [] };
      const newOutput = [...(existing.output || []), line];
      newResults.set(testId, { ...existing, output: newOutput });
      return newResults;
    });
  };

  const runTestSuite = async (suite: TestSuite): Promise<void> => {
    const testId = suite.id;
    
    updateTestResult(testId, {
      name: suite.name,
      status: 'running'
    });

    setCurrentTest(testId);
    const startTime = Date.now();

    try {
      // Use the test runner API through IPC
      const result = await window.electronAPI.runTestSuite(testId, suite.command, suite.args);

      const duration = Date.now() - startTime;
      
      // Process output if available
      if (result.output && result.output.length > 0) {
        result.output.forEach(line => addOutput(testId, line));
      }
      
      if (result.success) {
        updateTestResult(testId, {
          status: 'passed',
          duration,
          details: result.details || `${suite.name} completed successfully`,
          output: result.output || []
        });
      } else {
        updateTestResult(testId, {
          status: 'failed',
          duration,
          error: result.error || 'Test suite failed',
          details: result.details,
          output: result.output || []
        });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(testId, {
        status: 'failed',
        duration,
        error: error.message || 'Test suite execution failed',
        output: []
      });
    }
  };

  const runAllTests = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setOverallStatus('running');
    setCurrentTest(null);
    setTestResults(new Map());

    // Initialize test results as pending (exclude 'all' meta-suite)
    const suitesToRun = TEST_SUITES.filter(suite => suite.id !== 'all');
    suitesToRun.forEach(suite => {
      updateTestResult(suite.id, {
        name: suite.name,
        status: 'pending'
      });
    });

    abortControllerRef.current = new AbortController();

    try {
      // Run tests in sequence to avoid resource conflicts
      // Exclude the 'all' meta-suite from individual execution
      const suitesToRun = TEST_SUITES.filter(suite => suite.id !== 'all');
      for (const suite of suitesToRun) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        await runTestSuite(suite);
      }

      setOverallStatus('completed');
    } catch (error) {
      console.error('Test execution error:', error);
      setOverallStatus('completed');
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const runSingleTest = async (suiteId: string) => {
    if (isRunning) return;

    // If 'all' suite is clicked, run all tests instead
    if (suiteId === 'all') {
      await runAllTests();
      return;
    }

    const suite = TEST_SUITES.find(s => s.id === suiteId);
    if (!suite) return;

    setIsRunning(true);
    setOverallStatus('running');
    
    // Clear existing results and set only this test as pending
    setTestResults(new Map());
    updateTestResult(suiteId, {
      name: suite.name,
      status: 'pending'
    });

    abortControllerRef.current = new AbortController();

    try {
      await runTestSuite(suite);
      setOverallStatus('completed');
    } catch (error) {
      console.error('Test execution error:', error);
      setOverallStatus('completed');
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const stopTests = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
    setCurrentTest(null);
    setOverallStatus('idle');
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '#757575';
      case 'running': return '#2196f3';
      case 'passed': return '#4caf50';
      case 'failed': return '#f44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '⚡';
      case 'passed': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getTotalEstimatedTime = () => {
    return TEST_SUITES.reduce((total, suite) => total + suite.estimatedDuration, 0);
  };

  const getElapsedTime = () => {
    const runningTests = Array.from(testResults.values()).filter(r => r.status === 'running');
    if (runningTests.length === 0) return 0;
    // This is a simplified calculation - in a real implementation, you'd track start times
    return 0;
  };

  const getCompletionStats = () => {
    const results = Array.from(testResults.values());
    const completed = results.filter(r => r.status === 'passed' || r.status === 'failed');
    const passed = results.filter(r => r.status === 'passed');
    const failed = results.filter(r => r.status === 'failed');
    
    return {
      total: results.length,
      completed: completed.length,
      passed: passed.length,
      failed: failed.length,
      pending: results.length - completed.length
    };
  };

  if (!isOpen) return null;

  const stats = getCompletionStats();

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90vw',
        maxWidth: '1200px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafafa'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
              🧪 Test Runner Dashboard
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              Execute and monitor automated tests for the secure token management system
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setShowDebugPanel(!showDebugPanel);
                if (!showDebugPanel) {
                  loadDebugLogFiles();
                }
              }}
              className="btn secondary"
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Toggle Debug Panel"
            >
              🐛 Debug
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '4px'
              }}
              disabled={isRunning}
            >
              ×
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {overallStatus !== 'idle' && (
          <div style={{
            padding: '12px 24px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '14px' }}>
                <strong>Status:</strong>{' '}
                <span style={{ color: isRunning ? '#2196f3' : stats.failed > 0 ? '#f44336' : '#4caf50' }}>
                  {isRunning ? 'Running...' : stats.failed > 0 ? 'Some tests failed' : 'All tests completed'}
                </span>
              </div>
              <div style={{ fontSize: '14px' }}>
                <strong>Progress:</strong> {stats.completed}/{stats.total} tests
              </div>
              {stats.passed > 0 && (
                <div style={{ fontSize: '14px', color: '#4caf50' }}>
                  ✅ {stats.passed} passed
                </div>
              )}
              {stats.failed > 0 && (
                <div style={{ fontSize: '14px', color: '#f44336' }}>
                  ❌ {stats.failed} failed
                </div>
              )}
            </div>
            {isRunning && (
              <button
                onClick={stopTests}
                className="btn danger"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Stop Tests
              </button>
            )}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Test Suites Panel */}
          <div style={{
            width: showDebugPanel ? '300px' : '400px',
            borderRight: '1px solid #e0e0e0',
            padding: '20px',
            backgroundColor: '#fafafa',
            overflowY: 'auto',
            transition: 'width 0.3s ease'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                Test Suites
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#666' }}>
                Estimated total time: ~{Math.ceil(getTotalEstimatedTime() / 60)} minutes
              </p>
              
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="btn primary"
                style={{
                  width: '100%',
                  marginBottom: '16px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isRunning ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                    Running Tests...
                  </>
                ) : (
                  <>
                    🚀 Run All Tests
                  </>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {TEST_SUITES.map((suite) => {
                const result = testResults.get(suite.id);
                const isCurrentlyRunning = currentTest === suite.id;
                
                return (
                  <div
                    key={suite.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      padding: '16px',
                      backgroundColor: 'white',
                      cursor: isRunning && !isCurrentlyRunning ? 'not-allowed' : 'pointer',
                      opacity: isRunning && !isCurrentlyRunning ? 0.7 : 1,
                      borderLeft: result ? `4px solid ${getStatusColor(result.status)}` : '4px solid #e0e0e0'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{suite.icon}</span>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                          {suite.name}
                        </h4>
                        {result && (
                          <span style={{ fontSize: '12px' }}>
                            {getStatusIcon(result.status)}
                          </span>
                        )}
                      </div>
                      {result?.duration && (
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {(result.duration / 1000).toFixed(1)}s
                        </div>
                      )}
                    </div>
                    
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '12px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}>
                      {suite.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        ~{suite.estimatedDuration}s estimate
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => runSingleTest(suite.id)}
                          disabled={isRunning}
                          className="btn secondary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          Run
                        </button>
                        {result?.output && result.output.length > 0 && (
                          <button
                            onClick={() => setShowOutput(showOutput === suite.id ? null : suite.id)}
                            className="btn secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            {showOutput === suite.id ? 'Hide' : 'View'} Output
                          </button>
                        )}
                      </div>
                    </div>

                    {result?.error && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: '#ffebee',
                        border: '1px solid #ffcdd2',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#c62828'
                      }}>
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}

                    {result?.details && result.status === 'passed' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: '#e8f5e8',
                        border: '1px solid #c8e6c9',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#2e7d32'
                      }}>
                        {result.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debug Panel */}
          {showDebugPanel && (
            <div style={{
              width: '300px',
              borderRight: '1px solid #e0e0e0',
              padding: '16px',
              backgroundColor: '#f8f8f8',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                  🐛 Debug Controls
                </h3>
                
                {debugConfig && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={debugConfig.enabled}
                        onChange={toggleDebugLogging}
                        style={{ margin: 0 }}
                      />
                      Enable Debug Logging
                    </label>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {debugConfig.enabled ? 
                        'Debug logs are being written to file' : 
                        'Debug logging is disabled'
                      }
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  <button
                    onClick={loadDebugLogFiles}
                    className="btn secondary"
                    style={{ fontSize: '11px', padding: '4px 6px', flex: 1 }}
                  >
                    Refresh Logs
                  </button>
                  <button
                    onClick={clearDebugLogs}
                    className="btn danger"
                    style={{ fontSize: '11px', padding: '4px 6px', flex: 1 }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                  Debug Log Files ({debugLogFiles.length})
                </h4>
                
                {debugLogFiles.length > 0 ? (
                  <div style={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}>
                    {debugLogFiles.map((file, index) => (
                      <div
                        key={file.path}
                        style={{
                          padding: '8px',
                          borderBottom: index < debugLogFiles.length - 1 ? '1px solid #f0f0f0' : 'none',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                        onClick={() => viewDebugLogFile(file.path)}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                          {file.name}
                        </div>
                        <div style={{ color: '#666' }}>
                          Size: {(file.size / 1024).toFixed(1)}KB
                        </div>
                        <div style={{ color: '#666' }}>
                          {new Date(file.created).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}>
                    No debug log files found.
                    {debugConfig && !debugConfig.enabled && (
                      <div style={{ marginTop: '8px' }}>
                        Enable debug logging to start capturing logs.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Output Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {showOutput || debugLogContent ? (
              <>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5'
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    {debugLogContent ? 
                      'Debug Log Content' : 
                      `${TEST_SUITES.find(s => s.id === showOutput)?.name} Output`
                    }
                  </h3>
                  <button
                    onClick={() => {
                      setShowOutput(null);
                      setDebugLogContent('');
                    }}
                    className="btn secondary"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    Close
                  </button>
                </div>
                <div
                  ref={outputRef}
                  style={{
                    flex: 1,
                    padding: '16px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '12px',
                    backgroundColor: '#1e1e1e',
                    color: '#d4d4d4',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {debugLogContent ? 
                    debugLogContent :
                    (testResults.get(showOutput)?.output && testResults.get(showOutput)?.output.length > 0
                      ? testResults.get(showOutput)?.output.join('\n')
                      : 'No output available yet. Output will appear here when the test runs.')}
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ fontSize: '48px', opacity: 0.3 }}>🧪</div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                    Ready to Run Tests
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Select a test suite to run, or click "Run All Tests" to execute the complete suite
                  </p>
                </div>
                {overallStatus === 'completed' && (
                  <div style={{
                    padding: '16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: stats.failed > 0 ? '#ffebee' : '#e8f5e8',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {stats.failed > 0 ? '⚠️' : '🎉'}
                    </div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      Test Run Complete
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      {stats.passed} passed • {stats.failed} failed • {stats.total} total
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}