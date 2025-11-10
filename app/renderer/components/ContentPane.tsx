import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ContentPaneProps {
  activeModule: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
}

export const ContentPane: React.FC<ContentPaneProps> = ({
  activeModule,
  title,
  subtitle,
  children,
  loading = false,
  error
}) => {
  if (loading) {
    return (
      <div className="app-content">
        <div className="content-header">
          <h1 className="content-title">Loading...</h1>
        </div>
        <div className="content-body">
          <div className="app-panel">
            <div className="flex flex-col items-center justify-center h-full" style={{ gap: '16px' }}>
              <LoadingSpinner 
                size="large" 
                message={`Loading ${title}...`}
                variant="primary"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-content">
        <div className="content-header">
          <h1 className="content-title">Error</h1>
        </div>
        <div className="content-body">
          <div className="app-panel">
            <div className="empty-state">
              <div className="empty-state-icon" style={{ color: 'var(--color-error)' }}>
                ⚠️
              </div>
              <h3 className="empty-state-title text-error">Something went wrong</h3>
              <p className="empty-state-description">
                {error}
              </p>
              <button 
                className="btn primary mt-md"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content">
      <div className="content-header">
        <h1 className="content-title">{title}</h1>
        {subtitle && <p className="content-subtitle">{subtitle}</p>}
      </div>
      <div className="content-body">
        {React.isValidElement(children) ? (
          // If children is a React element, render it directly
          children
        ) : (
          // Otherwise, wrap it in the content-inner container
          <div className="app-panel">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// Welcome screen component for the main dashboard
export const WelcomeContent: React.FC = () => {
  return (
    <div className="welcome-content">
      <div className="welcome-inner">
        <h1 className="welcome-title">Welcome aboard!</h1>
        <p className="welcome-subtitle">
          We are thrilled to welcome you to our team. This app is your
          go-to place for all important company knowledge and information.
        </p>
        <div className="welcome-description">
          <p>
            Select any module from the navigation menu to get started.
            Each module contains powerful tools to help you manage projects,
            run tests, and collaborate effectively.
          </p>
        </div>
      </div>
    </div>
  );
};

// Empty state component for modules without content
export const EmptyState: React.FC<{
  icon: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <h3 className="empty-state-title">
        {title}
      </h3>
      <p className="empty-state-description">
        {description}
      </p>
      {actionText && onAction && (
        <button 
          className="btn primary"
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
