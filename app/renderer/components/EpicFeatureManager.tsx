import React, { useState, useEffect } from 'react';
import { useAppStore } from '../state/store';

interface EpicFeatureManagerProps {
  projectId: string;
}

export function EpicFeatureManager({ projectId }: EpicFeatureManagerProps) {
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [isCreatingEpic, setIsCreatingEpic] = useState(false);
  const [isCreatingFeature, setIsCreatingFeature] = useState(false);
  const [creatingFeatureForEpic, setCreatingFeatureForEpic] = useState<string | null>(null);
  const [newEpicTitle, setNewEpicTitle] = useState('');
  const [newFeatureTitle, setNewFeatureTitle] = useState('');

  // Mock data for now - will be connected to store later
  const [epics, setEpics] = useState([
    { id: 'epic-1', title: 'User Authentication System', project_id: projectId, sort_order: 1, state: 'Active' },
    { id: 'epic-2', title: 'Dashboard Analytics', project_id: projectId, sort_order: 2, state: 'New' }
  ]);

  const [features, setFeatures] = useState([
    { id: 'feature-1', title: 'Login Form', epic_id: 'epic-1', sort_order: 1, state: 'Active' },
    { id: 'feature-2', title: 'Password Reset', epic_id: 'epic-1', sort_order: 2, state: 'New' },
    { id: 'feature-3', title: 'Charts Component', epic_id: 'epic-2', sort_order: 1, state: 'New' }
  ]);

  const handleCreateEpic = async () => {
    if (!newEpicTitle.trim()) return;

    const newEpic = {
      id: `epic-${Date.now()}`,
      title: newEpicTitle,
      project_id: projectId,
      sort_order: epics.length + 1,
      state: 'New'
    };

    setEpics(prev => [...prev, newEpic]);
    setNewEpicTitle('');
    setIsCreatingEpic(false);
  };

  const handleCreateFeature = async (epicId?: string) => {
    const targetEpicId = epicId || selectedEpic || creatingFeatureForEpic;
    if (!newFeatureTitle.trim() || !targetEpicId) return;

    const existingFeatures = features.filter(f => f.epic_id === targetEpicId);
    const newFeature = {
      id: `feature-${Date.now()}`,
      title: newFeatureTitle,
      epic_id: targetEpicId,
      sort_order: existingFeatures.length + 1,
      state: 'New'
    };

    setFeatures(prev => [...prev, newFeature]);
    setNewFeatureTitle('');
    setIsCreatingFeature(false);
    setCreatingFeatureForEpic(null);
  };

  const handleAddFeatureToEpic = (epicId: string) => {
    setCreatingFeatureForEpic(epicId);
    setIsCreatingFeature(false); // Clear any global feature creation
    setSelectedEpic(epicId); // Ensure the epic is selected/expanded
  };

  const handleCancelFeatureCreation = () => {
    setIsCreatingFeature(false);
    setCreatingFeatureForEpic(null);
    setNewFeatureTitle('');
  };

  const handleEpicDoubleClick = (epic: any) => {
    // TODO: Open full EPIC details form
    console.log('Open EPIC details for:', epic.title);
  };

  const handleFeatureDoubleClick = (feature: any) => {
    // TODO: Open full Feature details form
    console.log('Open Feature details for:', feature.title);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'New': return '#0078d4';
      case 'Active': return '#107c10';
      case 'Resolved': return '#881798';
      case 'Closed': return '#323130';
      default: return '#605e5c';
    }
  };

  const filteredFeatures = features.filter(f => f.epic_id === selectedEpic);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Create buttons */}
      <div className="card-header" style={{ 
        flexShrink: 0,
        borderBottom: '1px solid #e1e1e1',
        padding: '12px 16px',
        backgroundColor: '#f8f9fa'
      }}>
        <div className="d-flex justify-between align-center">
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            Work Items
          </h2>
          <div className="d-flex" style={{ gap: '8px' }}>
            <button 
              className="btn primary"
              onClick={() => setIsCreatingEpic(true)}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              + New Epic
            </button>
            <button 
              className="btn secondary"
              onClick={() => selectedEpic && setIsCreatingFeature(true)}
              disabled={!selectedEpic}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              + New Feature
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Epic Creation Form */}
        {isCreatingEpic && (
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#fff4ce', 
            borderBottom: '1px solid #d83b01',
            flexShrink: 0
          }}>
            <div className="d-flex align-center" style={{ gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>New Epic:</span>
              <input
                type="text"
                value={newEpicTitle}
                onChange={(e) => setNewEpicTitle(e.target.value)}
                placeholder="Enter epic title..."
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  fontSize: '14px'
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreateEpic();
                  if (e.key === 'Escape') setIsCreatingEpic(false);
                }}
              />
              <button 
                className="btn primary" 
                onClick={handleCreateEpic}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Save
              </button>
              <button 
                className="btn secondary" 
                onClick={() => setIsCreatingEpic(false)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Feature Creation Form - Global */}
        {isCreatingFeature && selectedEpic && (
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: '#deecf9', 
            borderBottom: '1px solid #0078d4',
            flexShrink: 0
          }}>
            <div className="d-flex align-center" style={{ gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>New Feature:</span>
              <input
                type="text"
                value={newFeatureTitle}
                onChange={(e) => setNewFeatureTitle(e.target.value)}
                placeholder="Enter feature title..."
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  fontSize: '14px'
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreateFeature();
                  if (e.key === 'Escape') handleCancelFeatureCreation();
                }}
              />
              <button 
                className="btn primary" 
                onClick={() => handleCreateFeature()}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Save
              </button>
              <button 
                className="btn secondary" 
                onClick={handleCancelFeatureCreation}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Epic/Feature List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {epics.map((epic) => (
            <div key={epic.id} style={{ marginBottom: '8px' }}>
              {/* Epic Item */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: selectedEpic === epic.id ? '#f3f2f1' : 'transparent',
                  borderLeft: selectedEpic === epic.id ? '3px solid #0078d4' : '3px solid transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid #edebe9',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedEpic(selectedEpic === epic.id ? null : epic.id)}
                onDoubleClick={() => handleEpicDoubleClick(epic)}
              >
                <div className="d-flex align-center justify-between">
                  <div className="d-flex align-center" style={{ gap: '12px' }}>
                    {/* Epic Icon */}
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: '#881798',
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      E
                    </div>
                    
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#323130',
                        marginBottom: '2px'
                      }}>
                        {epic.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#605e5c' }}>
                        Epic • {epic.state}
                      </div>
                    </div>
                  </div>
                  
                  <div className="d-flex align-center" style={{ gap: '8px' }}>
                    {/* Add Feature Button */}
                    <button
                      className="btn secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFeatureToEpic(epic.id);
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '3px',
                        backgroundColor: '#0078d4',
                        color: 'white',
                        border: 'none'
                      }}
                      title="Add new feature to this epic"
                    >
                      +
                    </button>
                    
                    {/* Collapse/Expand indicator */}
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8a8886',
                      transform: selectedEpic === epic.id ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {/* Features under this Epic */}
              {selectedEpic === epic.id && (
                <div style={{ backgroundColor: '#faf9f8', borderLeft: '3px solid #e1e1e1' }}>
                  {filteredFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      style={{
                        padding: '10px 16px 10px 40px',
                        borderBottom: '1px solid #edebe9',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onDoubleClick={() => handleFeatureDoubleClick(feature)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f2f1'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div className="d-flex align-center" style={{ gap: '12px' }}>
                        {/* Feature Icon */}
                        <div style={{ 
                          width: '14px', 
                          height: '14px', 
                          backgroundColor: '#0078d4',
                          borderRadius: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}>
                          F
                        </div>
                        
                        <div>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '500', 
                            color: '#323130',
                            marginBottom: '1px'
                          }}>
                            {feature.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#605e5c' }}>
                            Feature • {feature.state}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Per-EPIC Feature Creation Form */}
                  {creatingFeatureForEpic === epic.id && (
                    <div style={{
                      padding: '12px 16px 12px 40px',
                      backgroundColor: '#deecf9',
                      borderBottom: '1px solid #0078d4',
                      margin: '0 0 8px 0'
                    }}>
                      <div className="d-flex align-center" style={{ gap: '8px' }}>
                        <div style={{ 
                          width: '14px', 
                          height: '14px', 
                          backgroundColor: '#0078d4',
                          borderRadius: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}>
                          F
                        </div>
                        <input
                          type="text"
                          value={newFeatureTitle}
                          onChange={(e) => setNewFeatureTitle(e.target.value)}
                          placeholder="Enter feature title..."
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            border: '1px solid #8a8886',
                            borderRadius: '2px',
                            fontSize: '13px'
                          }}
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleCreateFeature(epic.id);
                            if (e.key === 'Escape') handleCancelFeatureCreation();
                          }}
                        />
                        <button 
                          className="btn primary" 
                          onClick={() => handleCreateFeature(epic.id)}
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                        >
                          Save
                        </button>
                        <button 
                          className="btn secondary" 
                          onClick={handleCancelFeatureCreation}
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {filteredFeatures.length === 0 && creatingFeatureForEpic !== epic.id && (
                    <div style={{ 
                      padding: '12px 16px 12px 40px', 
                      fontSize: '12px', 
                      color: '#a19f9d',
                      fontStyle: 'italic'
                    }}>
                      No features in this epic. Double-click the epic to add details, or click the "+" button to add a feature.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {epics.length === 0 && (
            <div style={{ 
              padding: '40px 16px', 
              textAlign: 'center', 
              color: '#a19f9d' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                📋
              </div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                No epics yet
              </div>
              <div style={{ fontSize: '12px', marginBottom: '16px' }}>
                Create your first epic to start organizing work items.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}