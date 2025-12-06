import React from 'react';

interface ComingSoonProps {
  featureName: string;
  description?: string;
  estimatedRelease?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ 
  featureName, 
  description,
  estimatedRelease 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '20px',
        opacity: 0.3
      }}>
        🚧
      </div>
      
      <h1 style={{
        fontSize: '32px',
        fontWeight: 600,
        color: '#2c3e50',
        marginBottom: '16px'
      }}>
        {featureName}
      </h1>
      
      <h2 style={{
        fontSize: '24px',
        fontWeight: 400,
        color: '#7f8c8d',
        marginBottom: '24px'
      }}>
        Coming Soon
      </h2>
      
      {description && (
        <p style={{
          fontSize: '16px',
          color: '#95a5a6',
          maxWidth: '600px',
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          {description}
        </p>
      )}
      
      {estimatedRelease && (
        <div style={{
          display: 'inline-block',
          padding: '8px 16px',
          backgroundColor: '#3498db',
          color: '#ffffff',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 500
        }}>
          Estimated Release: {estimatedRelease}
        </div>
      )}
      
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#ecf0f1',
        borderRadius: '6px',
        maxWidth: '500px'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#7f8c8d',
          margin: 0
        }}>
          This feature is currently under development. Check back soon for updates!
        </p>
      </div>
    </div>
  );
};
