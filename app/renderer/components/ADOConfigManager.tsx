import React, { useState, useEffect } from 'react';

export interface ADOConfiguration {
  id: number;
  org_url: string;
  project_name: string;
  auth_mode: string;
  pat_token_expiry_date?: string;
  client_id?: string;
  tenant_id?: string;
  webhook_url?: string;
  webhook_secret?: string;
  max_retry_attempts: number;
  base_delay_ms: number;
  is_enabled: boolean;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
  tokenExpiry?: {
    isExpired: boolean;
    willExpireSoon: boolean;
    expiryDate: string | null;
    daysUntilExpiry: number | null;
  };
}

export function ADOConfigManager() {
  const [configurations, setConfigurations] = useState<ADOConfiguration[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ADOConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    org_url: '',
    project_name: '',
    pat_token: '',
    pat_token_expiry_date: '',
    webhook_url: '',
    webhook_secret: '',
    is_enabled: true
  });
  
  // Validation state
  const [patTokenError, setPatTokenError] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  
  // Helper function to get default expiry date (90 days from today)
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().split('T')[0];
  };
  
  // Helper function to get minimum expiry date (today)
  const getMinExpiryDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Initialize expiry date when creating new config
  useEffect(() => {
    if (isCreating && !formData.pat_token_expiry_date) {
      setFormData(prev => ({ ...prev, pat_token_expiry_date: getDefaultExpiryDate() }));
    }
  }, [isCreating]);

  useEffect(() => {
    loadConfigurations();
  }, []);
  
  // Validate PAT token as user types
  const validatePATToken = async (token: string) => {
    if (!token) {
      setPatTokenError(null);
      return;
    }
    
    setIsValidatingToken(true);
    try {
      const result = await window.electronAPI.validatePATToken(token);
      if (result.success) {
        setPatTokenError(result.error);
      } else {
        setPatTokenError('Failed to validate token');
      }
    } catch (err) {
      setPatTokenError('Failed to validate token');
    } finally {
      setIsValidatingToken(false);
    }
  };

  const loadConfigurations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.getADOConfigurationsWithExpiry();
      if (result.success) {
        setConfigurations(result.configurations || []);
      } else {
        setError(result.error || 'Failed to load configurations');
      }
    } catch (err) {
      setError('Failed to load configurations');
      console.error('Load configurations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfiguration = async () => {
    if (!formData.org_url || !formData.project_name || !formData.pat_token) {
      setError('Organization URL, Project Name, and PAT Token are required');
      return;
    }
    
    if (!formData.pat_token_expiry_date) {
      setError('PAT Token expiry date is required');
      return;
    }
    
    // Check if expiry date is in the past
    const expiryDate = new Date(formData.pat_token_expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    if (expiryDate < today) {
      setError('PAT Token expiry date cannot be in the past');
      return;
    }
    
    // Final PAT token validation
    if (patTokenError) {
      setError(`PAT Token validation failed: ${patTokenError}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.storePATToken(
        formData.org_url,
        formData.project_name,
        formData.pat_token,
        {
          webhookUrl: formData.webhook_url,
          webhookSecret: formData.webhook_secret || undefined,
          isEnabled: formData.is_enabled,
          expiryDate: formData.pat_token_expiry_date
        }
      );

      if (result.success) {
        await loadConfigurations();
        setIsCreating(false);
        resetForm();
      } else {
        setError(result.error || 'Failed to create configuration');
      }
    } catch (err) {
      setError('Failed to create configuration');
      console.error('Create configuration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfiguration = async () => {
    if (!editingConfig) return;

    setLoading(true);
    setError(null);

    try {
      // Update basic configuration
      const updateResult = await window.electronAPI.updateADOConfiguration(
        editingConfig.org_url,
        editingConfig.project_name,
        {
          webhook_url: formData.webhook_url,
          webhook_secret: formData.webhook_secret,
          is_enabled: formData.is_enabled
        }
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update configuration');
      }

      // Update PAT token if provided
      if (formData.pat_token) {
        // Validate expiry date
        if (formData.pat_token_expiry_date) {
          const expiryDate = new Date(formData.pat_token_expiry_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (expiryDate < today) {
            throw new Error('PAT Token expiry date cannot be in the past');
          }
        }
        
        // Check for token validation errors
        if (patTokenError) {
          throw new Error(`PAT Token validation failed: ${patTokenError}`);
        }
        
        const tokenResult = await window.electronAPI.updatePATToken(
          editingConfig.org_url,
          editingConfig.project_name,
          formData.pat_token,
          formData.pat_token_expiry_date || undefined
        );

        if (!tokenResult.success) {
          throw new Error(tokenResult.error || 'Failed to update PAT token');
        }
      }

      await loadConfigurations();
      setEditingConfig(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update configuration');
      console.error('Update configuration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfiguration = async (config: ADOConfiguration) => {
    if (!confirm(`Delete configuration for ${config.org_url}/${config.project_name}?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.removePATToken(
        config.org_url,
        config.project_name
      );

      if (result.success) {
        await loadConfigurations();
      } else {
        setError(result.error || 'Failed to delete configuration');
      }
    } catch (err) {
      setError('Failed to delete configuration');
      console.error('Delete configuration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (config: ADOConfiguration) => {
    setTestingConnection(`${config.org_url}/${config.project_name}`);
    setError(null);

    try {
      const result = await window.electronAPI.testADOConnection(
        config.org_url,
        config.project_name
      );

      if (result.success) {
        const status = result.connected ? 'connected' : 'disconnected';
        await window.electronAPI.updateConnectionStatus(
          config.org_url,
          config.project_name,
          status,
          new Date().toISOString()
        );
        await loadConfigurations();
      } else {
        setError(result.error || 'Connection test failed');
      }
    } catch (err) {
      setError('Connection test failed');
      console.error('Test connection error:', err);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleGenerateWebhookSecret = async () => {
    try {
      const result = await window.electronAPI.generateWebhookSecret();
      if (result.success) {
        setFormData(prev => ({ ...prev, webhook_secret: result.secret || '' }));
      }
    } catch (err) {
      console.error('Generate webhook secret error:', err);
    }
  };

  const startEdit = (config: ADOConfiguration) => {
    setEditingConfig(config);
    setFormData({
      org_url: config.org_url,
      project_name: config.project_name,
      pat_token: '', // Don't pre-fill token for security
      pat_token_expiry_date: config.pat_token_expiry_date || '',
      webhook_url: config.webhook_url || '',
      webhook_secret: config.webhook_secret || '',
      is_enabled: config.is_enabled
    });
    setPatTokenError(null); // Reset validation errors
    setIsCreating(false);
  };

  const resetForm = () => {
    setFormData({
      org_url: '',
      project_name: '',
      pat_token: '',
      pat_token_expiry_date: '',
      webhook_url: '',
      webhook_secret: '',
      is_enabled: true
    });
    setPatTokenError(null);
    setIsValidatingToken(false);
    setIsCreating(false);
    setEditingConfig(null);
    setError(null);
  };

  const handleCreateSampleConfiguration = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate a sample PAT token (52 characters, base64-like)
      const sampleToken = Array.from({ length: 52 }, () => 
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(
          Math.floor(Math.random() * 62)
        )
      ).join('');

      // Set expiry to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      const expiryDateStr = expiryDate.toISOString().split('T')[0];

      const result = await window.electronAPI.storePATToken(
        'https://dev.azure.com/contoso',
        'SampleProject',
        sampleToken,
        {
          webhookUrl: 'https://webhook.example.com/ado-events',
          isEnabled: true,
          expiryDate: expiryDateStr
        }
      );

      if (result.success) {
        await loadConfigurations();
        console.log('Sample ADO configuration created successfully');
      } else {
        setError(result.error || 'Failed to create sample configuration');
      }
    } catch (err) {
      setError('Failed to create sample configuration');
      console.error('Create sample configuration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#107c10';
      case 'disconnected': return '#605e5c';
      case 'error': return '#d83b01';
      default: return '#605e5c';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✓';
      case 'disconnected': return '○';
      case 'error': return '✗';
      default: return '?';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="card-header" style={{ 
        flexShrink: 0,
        borderBottom: '1px solid #e1e1e1',
        padding: '12px 16px',
        backgroundColor: '#f8f9fa'
      }}>
        <div className="d-flex justify-between align-center">
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Azure DevOps Configurations
          </h2>
          <div className="d-flex" style={{ gap: '8px' }}>
            <button 
              className="btn primary"
              onClick={() => setIsCreating(true)}
              disabled={loading || isCreating || editingConfig !== null}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              + New Configuration
            </button>
            <button 
              className="btn secondary"
              onClick={handleCreateSampleConfiguration}
              disabled={loading}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Create Sample
            </button>
            <button 
              className="btn secondary"
              onClick={loadConfigurations}
              disabled={loading}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef6f6',
          borderBottom: '1px solid #d83b01',
          color: '#d83b01',
          fontSize: '14px',
          flexShrink: 0
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#d83b01',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingConfig) && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f3f2f1', 
          borderBottom: '1px solid #d2d0ce',
          flexShrink: 0
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            {editingConfig ? 'Edit Configuration' : 'New Configuration'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Organization URL *
              </label>
              <input
                type="text"
                value={formData.org_url}
                onChange={(e) => setFormData(prev => ({ ...prev, org_url: e.target.value }))}
                placeholder="https://dev.azure.com/myorg"
                disabled={editingConfig !== null}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Project Name *
              </label>
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                placeholder="MyProject"
                disabled={editingConfig !== null}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
              Personal Access Token * {editingConfig && '(leave empty to keep current token)'}
              {process.env.NODE_ENV === 'development' && <span style={{ color: '#d83b01', fontSize: '10px' }}> [DEV: Unmasked]</span>}
            </label>
            <input
              type={process.env.NODE_ENV === 'development' ? 'text' : 'password'}
              value={formData.pat_token}
              onChange={(e) => {
                const token = e.target.value;
                setFormData(prev => ({ ...prev, pat_token: token }));
                // Debounced validation
                if (token) {
                  setTimeout(() => validatePATToken(token), 300);
                } else {
                  setPatTokenError(null);
                }
              }}
              placeholder={editingConfig ? 'Enter new token to update' : 'Enter your PAT token'}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: `1px solid ${patTokenError ? '#d83b01' : '#8a8886'}`,
                borderRadius: '2px',
                fontSize: '14px'
              }}
            />
            {isValidatingToken && (
              <div style={{ fontSize: '11px', color: '#605e5c', marginTop: '4px' }}>
                Validating token format...
              </div>
            )}
            {patTokenError && (
              <div style={{ fontSize: '11px', color: '#d83b01', marginTop: '4px' }}>
                ⚠ {patTokenError}
              </div>
            )}
            {!patTokenError && formData.pat_token && !isValidatingToken && (
              <div style={{ fontSize: '11px', color: '#107c10', marginTop: '4px' }}>
                ✓ Token format is valid
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
              Token Expiry Date *
            </label>
            <input
              type="date"
              value={formData.pat_token_expiry_date}
              onChange={(e) => setFormData(prev => ({ ...prev, pat_token_expiry_date: e.target.value }))}
              min={getMinExpiryDate()}
              placeholder="YYYY-MM-DD"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #8a8886',
                borderRadius: '2px',
                fontSize: '14px'
              }}
            />
            <div style={{ fontSize: '11px', color: '#605e5c', marginTop: '4px' }}>
              Default: 90 days from today ({getDefaultExpiryDate()}). You can choose a shorter period.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Webhook Secret
              </label>
              <input
                type="text"
                value={formData.webhook_secret}
                onChange={(e) => setFormData(prev => ({ ...prev, webhook_secret: e.target.value }))}
                placeholder="Auto-generated if empty"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ alignSelf: 'end' }}>
              <button
                type="button"
                onClick={handleGenerateWebhookSecret}
                className="btn secondary"
                style={{ fontSize: '11px', padding: '6px 8px', whiteSpace: 'nowrap' }}
              >
                Generate
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
              Webhook URL
            </label>
            <input
              type="text"
              value={formData.webhook_url}
              onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
              placeholder="https://your-server.com/webhooks/ado"
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #8a8886',
                borderRadius: '2px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={formData.is_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, is_enabled: e.target.checked }))}
                style={{ marginRight: '6px' }}
              />
              Configuration Enabled
            </label>
          </div>

          <div className="d-flex" style={{ gap: '8px' }}>
            <button 
              className="btn primary"
              onClick={editingConfig ? handleUpdateConfiguration : handleCreateConfiguration}
              disabled={loading}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {loading ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
            </button>
            <button 
              className="btn secondary"
              onClick={resetForm}
              disabled={loading}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Configuration List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading && configurations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#605e5c' }}>
            Loading configurations...
          </div>
        ) : configurations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#605e5c' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>⚙️</div>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No ADO configurations</div>
            <div style={{ fontSize: '12px' }}>Create your first configuration to connect to Azure DevOps.</div>
          </div>
        ) : (
          configurations.map((config) => (
            <div
              key={config.id}
              style={{
                padding: '16px',
                borderBottom: '1px solid #edebe9',
                backgroundColor: editingConfig?.id === config.id ? '#f3f2f1' : 'transparent'
              }}
            >
              <div className="d-flex justify-between align-center">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                    {config.org_url} / {config.project_name}
                  </div>
                  <div className="d-flex align-center" style={{ gap: '12px', fontSize: '12px', color: '#605e5c' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: getStatusColor(config.connection_status) }}>
                        {getStatusIcon(config.connection_status)}
                      </span>
                      {config.connection_status}
                    </span>
                    <span>{config.is_enabled ? 'Enabled' : 'Disabled'}</span>
                    {config.tokenExpiry && (
                      <span style={{ 
                        color: config.tokenExpiry.isExpired ? '#d83b01' : 
                               config.tokenExpiry.willExpireSoon ? '#f59e0b' : '#605e5c'
                      }}>
                        {config.tokenExpiry.isExpired ? '🔒 Token Expired' :
                         config.tokenExpiry.willExpireSoon ? '⚠ Expires Soon' :
                         config.tokenExpiry.daysUntilExpiry ? `Token: ${config.tokenExpiry.daysUntilExpiry}d left` : 'Token: No expiry set'}
                      </span>
                    )}
                    {config.last_sync_at && (
                      <span>Last sync: {new Date(config.last_sync_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="d-flex" style={{ gap: '4px' }}>
                  <button
                    className="btn secondary"
                    onClick={() => handleTestConnection(config)}
                    disabled={loading || testingConnection === `${config.org_url}/${config.project_name}`}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    {testingConnection === `${config.org_url}/${config.project_name}` ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => startEdit(config)}
                    disabled={loading || editingConfig !== null || isCreating}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn danger"
                    onClick={() => handleDeleteConfiguration(config)}
                    disabled={loading}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}