import React from 'react';
import { useAppStore } from '../state/store';

export const ErrorDisplay: React.FC = () => {
  const { errors, removeError, clearErrors } = useAppStore();

  if (errors.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 1000,
      maxWidth: '400px'
    }}>
      {errors.map((error, index) => (
        <div key={index} style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px 16px',
          marginBottom: '8px',
          borderRadius: '4px',
          borderLeft: '4px solid #f44336',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'flex-start',
          animation: 'slideIn 0.3s ease',
          fontSize: '14px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Error</strong>
            <div style={{ wordBreak: 'break-word' }}>{error}</div>
          </div>
          <button 
            onClick={() => removeError(index)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer',
              marginLeft: '8px',
              fontSize: '16px',
              lineHeight: '1',
              padding: '0',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Dismiss error"
          >
            ×
          </button>
        </div>
      ))}
      
      {errors.length > 1 && (
        <button 
          onClick={clearErrors} 
          style={{
            width: '100%',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            marginTop: '4px'
          }}
        >
          Clear All ({errors.length})
        </button>
      )}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};