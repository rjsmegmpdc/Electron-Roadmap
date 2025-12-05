/**
 * Tests for EventBus
 * 
 * Tests the event system including subscription, emission, unsubscription,
 * wildcard listeners, async events, and event history.
 */

import { EventBus, AppEvents } from '../../src/js/event-bus.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
    eventBus.clearEventHistory();
  });

  describe('Basic Event Management', () => {
    test('should subscribe and emit events', () => {
      const mockCallback = jest.fn();
      eventBus.on('test.event', mockCallback);
      
      eventBus.emit('test.event', 'test data');
      
      expect(mockCallback).toHaveBeenCalledWith('test data', expect.any(Object));
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('should unsubscribe from events', () => {
      const mockCallback = jest.fn();
      eventBus.on('test.event', mockCallback);
      eventBus.off('test.event', mockCallback);
      
      eventBus.emit('test.event', 'test data');
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should return unsubscribe function from on()', () => {
      const mockCallback = jest.fn();
      const unsubscribe = eventBus.on('test.event', mockCallback);
      
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
      eventBus.emit('test.event', 'test data');
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should handle multiple listeners for same event', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventBus.on('test.event', mockCallback1);
      eventBus.on('test.event', mockCallback2);
      
      eventBus.emit('test.event', 'test data');
      
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Once Listeners', () => {
    test('should fire once listeners only once', () => {
      const mockCallback = jest.fn();
      eventBus.once('test.event', mockCallback);
      
      eventBus.emit('test.event', 'test data 1');
      eventBus.emit('test.event', 'test data 2');
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('test data 1', expect.any(Object));
    });

    test('should return unsubscribe function from once()', () => {
      const mockCallback = jest.fn();
      const unsubscribe = eventBus.once('test.event', mockCallback);
      
      unsubscribe();
      eventBus.emit('test.event', 'test data');
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Priority System', () => {
    test('should execute listeners in priority order', () => {
      const executionOrder = [];
      
      eventBus.on('test.event', () => executionOrder.push('low'), { priority: 1 });
      eventBus.on('test.event', () => executionOrder.push('high'), { priority: 10 });
      eventBus.on('test.event', () => executionOrder.push('medium'), { priority: 5 });
      
      eventBus.emit('test.event');
      
      expect(executionOrder).toEqual(['high', 'medium', 'low']);
    });
  });

  describe('Context Binding', () => {
    test('should bind context to callbacks', () => {
      const testContext = { value: 'test' };
      let receivedContext;
      
      const callback = function(data) {
        receivedContext = this;
      };
      
      eventBus.on('test.event', callback, { context: testContext });
      eventBus.emit('test.event', 'test data');
      
      expect(receivedContext).toBe(testContext);
    });
  });

  describe('Wildcard Listeners', () => {
    test('should call wildcard listeners for all events', () => {
      const mockWildcardCallback = jest.fn();
      eventBus.onAny(mockWildcardCallback);
      
      eventBus.emit('test.event1', 'data1');
      eventBus.emit('test.event2', 'data2');
      
      expect(mockWildcardCallback).toHaveBeenCalledTimes(2);
      expect(mockWildcardCallback).toHaveBeenNthCalledWith(1, 'data1', expect.any(Object));
      expect(mockWildcardCallback).toHaveBeenNthCalledWith(2, 'data2', expect.any(Object));
    });

    test('should unsubscribe wildcard listeners', () => {
      const mockWildcardCallback = jest.fn();
      const unsubscribe = eventBus.onAny(mockWildcardCallback);
      
      unsubscribe();
      eventBus.emit('test.event', 'data');
      
      expect(mockWildcardCallback).not.toHaveBeenCalled();
    });
  });

  describe('Async Events', () => {
    test('should handle async event emission', async () => {
      const mockCallback = jest.fn();
      eventBus.on('test.event', mockCallback);
      
      await eventBus.emit('test.event', 'test data', { async: true });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('should handle async listeners', async () => {
      let resolved = false;
      const asyncCallback = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        resolved = true;
      };
      
      eventBus.on('test.event', asyncCallback);
      
      await eventBus.emit('test.event', null, { async: true });
      
      expect(resolved).toBe(true);
    });
  });

  describe('Event History', () => {
    test('should record event history by default', () => {
      eventBus.emit('test.event1', 'data1');
      eventBus.emit('test.event2', 'data2');
      
      const history = eventBus.getEventHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('test.event1');
      expect(history[0].data).toBe('data1');
      expect(history[1].name).toBe('test.event2');
      expect(history[1].data).toBe('data2');
    });

    test('should not record history when disabled', () => {
      eventBus.emit('test.event', 'data', { recordHistory: false });
      
      const history = eventBus.getEventHistory();
      
      expect(history).toHaveLength(0);
    });

    test('should clear event history', () => {
      eventBus.emit('test.event', 'data');
      eventBus.clearEventHistory();
      
      const history = eventBus.getEventHistory();
      
      expect(history).toHaveLength(0);
    });

    test('should limit history size', () => {
      // Emit more events than max history size
      for (let i = 0; i < 150; i++) {
        eventBus.emit(`test.event.${i}`, i);
      }
      
      const history = eventBus.getEventHistory();
      
      expect(history.length).toBeLessThanOrEqual(100);
      expect(history[history.length - 1].data).toBe(149); // Should keep most recent
    });
  });

  describe('Enable/Disable', () => {
    test('should not emit events when disabled', () => {
      const mockCallback = jest.fn();
      eventBus.on('test.event', mockCallback);
      
      eventBus.setEnabled(false);
      eventBus.emit('test.event', 'data');
      
      expect(mockCallback).not.toHaveBeenCalled();
      expect(eventBus.isEnabled()).toBe(false);
    });

    test('should resume emitting when re-enabled', () => {
      const mockCallback = jest.fn();
      eventBus.on('test.event', mockCallback);
      
      eventBus.setEnabled(false);
      eventBus.emit('test.event', 'data1');
      
      eventBus.setEnabled(true);
      eventBus.emit('test.event', 'data2');
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('data2', expect.any(Object));
    });
  });

  describe('Wait For Events', () => {
    test('should wait for event and resolve with data', async () => {
      setTimeout(() => {
        eventBus.emit('test.delayed', 'delayed data');
      }, 10);
      
      const result = await eventBus.waitFor('test.delayed');
      
      expect(result).toBe('delayed data');
    });

    test('should timeout when waiting for event', async () => {
      await expect(eventBus.waitFor('test.never', 50)).rejects.toThrow('Timeout waiting for event: test.never');
    });
  });

  describe('Utility Methods', () => {
    test('should get event names', () => {
      eventBus.on('test.event1', () => {});
      eventBus.on('test.event2', () => {});
      
      const eventNames = eventBus.getEventNames();
      
      expect(eventNames).toContain('test.event1');
      expect(eventNames).toContain('test.event2');
      expect(eventNames).toHaveLength(2);
    });

    test('should get listener count', () => {
      eventBus.on('test.event', () => {});
      eventBus.on('test.event', () => {});
      
      expect(eventBus.getListenerCount('test.event')).toBe(2);
      expect(eventBus.getListenerCount('nonexistent.event')).toBe(0);
    });

    test('should remove all listeners', () => {
      eventBus.on('test.event1', () => {});
      eventBus.on('test.event2', () => {});
      
      eventBus.removeAllListeners();
      
      expect(eventBus.getEventNames()).toHaveLength(0);
    });

    test('should remove listeners for specific event', () => {
      eventBus.on('test.event1', () => {});
      eventBus.on('test.event2', () => {});
      
      eventBus.removeAllListeners('test.event1');
      
      expect(eventBus.getListenerCount('test.event1')).toBe(0);
      expect(eventBus.getListenerCount('test.event2')).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid event name', () => {
      expect(() => eventBus.on('', () => {})).toThrow('Invalid event name or callback');
      expect(() => eventBus.on(null, () => {})).toThrow('Invalid event name or callback');
      expect(() => eventBus.emit('')).toThrow('Invalid event name');
    });

    test('should throw error for invalid callback', () => {
      expect(() => eventBus.on('test.event', null)).toThrow('Invalid event name or callback');
      expect(() => eventBus.on('test.event', 'not a function')).toThrow('Invalid event name or callback');
    });

    test('should continue with other listeners if one throws error', () => {
      const mockCallback1 = jest.fn(() => { throw new Error('Test error'); });
      const mockCallback2 = jest.fn();
      
      eventBus.on('test.event', mockCallback1);
      eventBus.on('test.event', mockCallback2);
      
      // Should not throw, but should log error
      eventBus.emit('test.event', 'data');
      
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('AppEvents Constants', () => {
    test('should provide predefined event constants', () => {
      expect(AppEvents.PROJECT_CREATED).toBe('project.created');
      expect(AppEvents.TASK_UPDATED).toBe('task.updated');
      expect(AppEvents.DATA_SAVED).toBe('data.saved');
      expect(AppEvents.ERROR_OCCURRED).toBe('error.occurred');
      
      // Ensure all events are strings
      Object.values(AppEvents).forEach(eventName => {
        expect(typeof eventName).toBe('string');
        expect(eventName.length).toBeGreaterThan(0);
      });
    });
  });
});