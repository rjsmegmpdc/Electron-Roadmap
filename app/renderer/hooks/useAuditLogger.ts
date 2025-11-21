import React, { useCallback, useEffect, useRef } from 'react';
import type { AuditEvent } from '../../main/services/AuditLogger';

// Extend the global window interface to include our audit API
declare global {
  interface Window {
    auditLogger?: {
      logUserInteraction: (action: string, component?: string, target?: string, additionalData?: Record<string, any>) => Promise<void>;
      logFormChange: (component: string, field: string, oldValue: any, newValue: any, validationResult?: { valid: boolean; errors?: string[] }) => Promise<void>;
      logNavigation: (from: string, to: string, trigger?: 'user' | 'system') => Promise<void>;
      logError: (error: Error, component?: string, additionalContext?: Record<string, any>) => Promise<void>;
      logDataChange: (action: string, entityType: string, entityId: string, oldData?: any, newData?: any) => Promise<void>;
      getRecentEvents: (minutes?: number) => Promise<AuditEvent[]>;
      getErrorContext: (errorTimestamp: string, contextMinutes?: number) => Promise<{ error: AuditEvent | null; leadingEvents: AuditEvent[] }>;
      exportLogs: (outputPath: string, filter?: any) => Promise<void>;
      getStats: () => Promise<any>;
    };
  }
}

/**
 * Hook for comprehensive audit logging of user interactions
 */
export const useAuditLogger = (componentName?: string) => {
  const componentRef = useRef(componentName);
  
  // Update component name if it changes
  componentRef.current = componentName;

  const logUserInteraction = useCallback(
    async (action: string, target?: string, additionalData?: Record<string, any>) => {
      try {
        await window.auditLogger?.logUserInteraction(
          action,
          componentRef.current,
          target,
          additionalData
        );
      } catch (error) {
        console.error('Failed to log user interaction:', error);
      }
    },
    []
  );

  const logFormChange = useCallback(
    async (field: string, oldValue: any, newValue: any, validationResult?: { valid: boolean; errors?: string[] }) => {
      try {
        await window.auditLogger?.logFormChange(
          componentRef.current || 'unknown-form',
          field,
          oldValue,
          newValue,
          validationResult
        );
      } catch (error) {
        console.error('Failed to log form change:', error);
      }
    },
    []
  );

  const logNavigation = useCallback(
    async (from: string, to: string, trigger: 'user' | 'system' = 'user') => {
      try {
        await window.auditLogger?.logNavigation(from, to, trigger);
      } catch (error) {
        console.error('Failed to log navigation:', error);
      }
    },
    []
  );

  const logError = useCallback(
    async (error: Error, additionalContext?: Record<string, any>) => {
      try {
        await window.auditLogger?.logError(error, componentRef.current, additionalContext);
      } catch (error) {
        console.error('Failed to log error:', error);
      }
    },
    []
  );

  const logDataChange = useCallback(
    async (action: string, entityType: string, entityId: string, oldData?: any, newData?: any) => {
      try {
        await window.auditLogger?.logDataChange(action, entityType, entityId, oldData, newData);
      } catch (error) {
        console.error('Failed to log data change:', error);
      }
    },
    []
  );

  return {
    logUserInteraction,
    logFormChange,
    logNavigation,
    logError,
    logDataChange,
  };
};

/**
 * Hook for tracking click interactions with detailed context
 */
export const useClickTracking = (componentName?: string) => {
  const { logUserInteraction } = useAuditLogger(componentName);

  const trackClick = useCallback(
    (event: React.MouseEvent, action: string = 'click', additionalData?: Record<string, any>) => {
      const target = event.target as HTMLElement;
      const targetInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.slice(0, 50), // First 50 chars
        dataset: { ...target.dataset },
        position: {
          x: event.clientX,
          y: event.clientY,
          pageX: event.pageX,
          pageY: event.pageY,
        },
        modifiers: {
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
        },
        ...additionalData,
      };

      logUserInteraction(action, target.id || target.className, targetInfo);
    },
    [logUserInteraction]
  );

  return { trackClick };
};

/**
 * Hook for tracking keyboard interactions
 */
export const useKeyboardTracking = (componentName?: string) => {
  const { logUserInteraction } = useAuditLogger(componentName);

  const trackKeyPress = useCallback(
    (event: React.KeyboardEvent, action: string = 'keypress', additionalData?: Record<string, any>) => {
      const keyInfo = {
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        target: {
          tagName: (event.target as HTMLElement).tagName,
          name: (event.target as HTMLInputElement).name,
          value: (event.target as HTMLInputElement).value?.slice(0, 100), // First 100 chars
        },
        ...additionalData,
      };

      logUserInteraction(action, (event.target as HTMLElement).id, keyInfo);
    },
    [logUserInteraction]
  );

  const trackTab = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Tab') {
        trackKeyPress(event, 'tab', {
          direction: event.shiftKey ? 'backward' : 'forward',
        });
      }
    },
    [trackKeyPress]
  );

  const trackEnter = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        trackKeyPress(event, 'enter');
      }
    },
    [trackKeyPress]
  );

  const trackEscape = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        trackKeyPress(event, 'escape');
      }
    },
    [trackKeyPress]
  );

  return { trackKeyPress, trackTab, trackEnter, trackEscape };
};

/**
 * Hook for tracking form interactions with detailed validation logging
 */
export const useFormTracking = (componentName: string) => {
  const { logFormChange, logUserInteraction } = useAuditLogger(componentName);
  const formValuesRef = useRef<Record<string, any>>({});

  const trackFieldChange = useCallback(
    (fieldName: string, newValue: any, validationResult?: { valid: boolean; errors?: string[] }) => {
      const oldValue = formValuesRef.current[fieldName];
      formValuesRef.current[fieldName] = newValue;

      logFormChange(fieldName, oldValue, newValue, validationResult);
    },
    [logFormChange]
  );

  const trackFormSubmit = useCallback(
    (formData: Record<string, any>, isValid: boolean, errors?: Record<string, string[]>) => {
      logUserInteraction('form_submit', 'form', {
        form_data: formData,
        is_valid: isValid,
        errors,
        field_count: Object.keys(formData).length,
      });
    },
    [logUserInteraction]
  );

  const trackFormReset = useCallback(
    () => {
      const previousData = { ...formValuesRef.current };
      formValuesRef.current = {};
      
      logUserInteraction('form_reset', 'form', {
        previous_data: previousData,
      });
    },
    [logUserInteraction]
  );

  const trackFieldFocus = useCallback(
    (fieldName: string, fieldType: string) => {
      logUserInteraction('field_focus', fieldName, {
        field_type: fieldType,
        current_value: formValuesRef.current[fieldName],
      });
    },
    [logUserInteraction]
  );

  const trackFieldBlur = useCallback(
    (fieldName: string, fieldType: string, hasChanged: boolean) => {
      logUserInteraction('field_blur', fieldName, {
        field_type: fieldType,
        has_changed: hasChanged,
        final_value: formValuesRef.current[fieldName],
      });
    },
    [logUserInteraction]
  );

  return {
    trackFieldChange,
    trackFormSubmit,
    trackFormReset,
    trackFieldFocus,
    trackFieldBlur,
  };
};

/**
 * Hook for automatically tracking component lifecycle and errors
 */
export const useComponentTracking = (componentName: string) => {
  const { logUserInteraction, logError } = useAuditLogger(componentName);

  // Track component mount
  useEffect(() => {
    logUserInteraction('component_mount', componentName);

    return () => {
      // Track component unmount
      logUserInteraction('component_unmount', componentName);
    };
  }, [componentName, logUserInteraction]);

  // Create error boundary effect
  const trackComponentError = useCallback(
    (error: Error, errorInfo: { componentStack?: string }) => {
      logError(error, {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    },
    [logError]
  );

  return { trackComponentError };
};

/**
 * Hook for tracking page/view navigation
 */
export const useNavigationTracking = () => {
  const { logNavigation } = useAuditLogger('NavigationTracker');
  const currentLocationRef = useRef<string>('');

  useEffect(() => {
    // Track initial page load
    const currentPath = window.location.pathname;
    currentLocationRef.current = currentPath;
    logNavigation('', currentPath, 'system');
  }, [logNavigation]);

  const trackNavigation = useCallback(
    (to: string, trigger: 'user' | 'system' = 'user') => {
      const from = currentLocationRef.current;
      currentLocationRef.current = to;
      logNavigation(from, to, trigger);
    },
    [logNavigation]
  );

  return { trackNavigation };
};

/**
 * Hook for tracking window/app events
 */
export const useWindowTracking = () => {
  const { logUserInteraction } = useAuditLogger('WindowTracker');

  useEffect(() => {
    const handleVisibilityChange = () => {
      logUserInteraction('visibility_change', 'window', {
        visible: !document.hidden,
        visibility_state: document.visibilityState,
      });
    };

    const handleFocus = () => {
      logUserInteraction('window_focus', 'window');
    };

    const handleBlur = () => {
      logUserInteraction('window_blur', 'window');
    };

    const handleResize = () => {
      logUserInteraction('window_resize', 'window', {
        inner_width: window.innerWidth,
        inner_height: window.innerHeight,
        outer_width: window.outerWidth,
        outer_height: window.outerHeight,
      });
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
    };
  }, [logUserInteraction]);
};

/**
 * Higher-order component for automatic component tracking
 */
export const withAuditTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const ComponentWithTracking = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent';
    const { trackComponentError } = useComponentTracking(name);

    try {
      return React.createElement(WrappedComponent, { ...props, ref } as any);
    } catch (error) {
      trackComponentError(error as Error, {
        componentStack: `Error in ${name}`,
      });
      throw error; // Re-throw to let error boundaries handle it
    }
  });

  ComponentWithTracking.displayName = `withAuditTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent'})`;
  return ComponentWithTracking;
};
