/**
 * Enhanced Drag and Drop Manager
 * 
 * Provides comprehensive drag and drop functionality with advanced features
 * including multi-select, touch support, visual feedback, and accessibility.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';

export class DragDropManager {
  constructor() {
    this.activeElements = new Set();
    this.dragData = null;
    this.dropZones = new Map();
    this.dragInProgress = false;
    this.touchSupport = 'ontouchstart' in window;
    this.multiSelectEnabled = true;
    this.selectedElements = new Set();
    
    this.config = {
      dragThreshold: configManager.get('ui.dragThreshold', 5),
      touchDelay: configManager.get('ui.touchDelay', 150),
      animationDuration: configManager.get('ui.animationDuration', 200),
      ghostOpacity: configManager.get('ui.ghostOpacity', 0.7),
      autoScroll: configManager.get('ui.autoScroll', true),
      autoScrollSensitivity: configManager.get('ui.autoScrollSensitivity', 50)
    };
    
    this.logger = logger.group ? logger.group('DragDrop') : logger;
    
    this._setupEventListeners();
    this._createStyleElements();
  }

  /**
   * Initialize drag and drop functionality
   */
  initialize() {
    try {
      this.logger.info('Initializing enhanced drag and drop manager');
      
      // Setup global event listeners
      this._setupGlobalEventListeners();
      
      // Create visual feedback elements
      this._createVisualFeedbackElements();
      
      // Setup accessibility features
      this._setupAccessibilityFeatures();
      
      this.logger.info('Drag and drop manager initialized successfully');
      
      eventBus.emit('dragdrop:initialized', {
        touchSupport: this.touchSupport,
        multiSelect: this.multiSelectEnabled
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize drag and drop manager', { error: error.message });
      errorHandler.handleError(error, 'DragDropManager.initialize');
    }
  }

  /**
   * Register draggable element
   * @param {HTMLElement} element - Element to make draggable
   * @param {Object} options - Drag options
   */
  registerDraggable(element, options = {}) {
    try {
      if (!element || !element.nodeType) {
        throw new Error('Invalid element provided');
      }

      const config = {
        type: options.type || 'default',
        data: options.data || {},
        handle: options.handle || null,
        ghost: options.ghost || null,
        revert: options.revert !== false,
        revertDuration: options.revertDuration || this.config.animationDuration,
        cursor: options.cursor || 'grabbing',
        disabled: options.disabled || false,
        multiSelect: options.multiSelect !== false,
        onStart: options.onStart || null,
        onDrag: options.onDrag || null,
        onEnd: options.onEnd || null
      };

      // Store configuration
      element._dragConfig = config;
      element._dragId = this._generateId();

      // Add visual indicators
      element.classList.add('draggable');
      if (config.disabled) {
        element.classList.add('drag-disabled');
      }

      // Setup event listeners based on device capabilities
      if (this.touchSupport) {
        this._setupTouchEvents(element);
      } else {
        this._setupMouseEvents(element);
      }

      // Setup keyboard events for accessibility
      this._setupKeyboardEvents(element);

      // Add to active elements
      this.activeElements.add(element);

      this.logger.debug('Registered draggable element', {
        id: element._dragId,
        type: config.type,
        touchSupport: this.touchSupport
      });

      eventBus.emit('dragdrop:element:registered', {
        element,
        type: config.type,
        id: element._dragId
      });

    } catch (error) {
      this.logger.error('Failed to register draggable element', { error: error.message });
      errorHandler.handleError(error, 'DragDropManager.registerDraggable');
    }
  }

  /**
   * Register drop zone
   * @param {HTMLElement} element - Element to make droppable
   * @param {Object} options - Drop options
   */
  registerDropZone(element, options = {}) {
    try {
      if (!element || !element.nodeType) {
        throw new Error('Invalid element provided');
      }

      const config = {
        accepts: options.accepts || ['default'],
        onDragEnter: options.onDragEnter || null,
        onDragOver: options.onDragOver || null,
        onDragLeave: options.onDragLeave || null,
        onDrop: options.onDrop || null,
        highlight: options.highlight !== false,
        highlightClass: options.highlightClass || 'drop-zone-active',
        disabled: options.disabled || false
      };

      const dropZoneId = this._generateId();
      element._dropZoneId = dropZoneId;
      element._dropConfig = config;

      // Add visual indicators
      element.classList.add('drop-zone');
      if (config.disabled) {
        element.classList.add('drop-zone-disabled');
      }

      // Store in drop zones map
      this.dropZones.set(dropZoneId, {
        element,
        config,
        active: false
      });

      this.logger.debug('Registered drop zone', {
        id: dropZoneId,
        accepts: config.accepts
      });

      eventBus.emit('dragdrop:dropzone:registered', {
        element,
        id: dropZoneId,
        accepts: config.accepts
      });

    } catch (error) {
      this.logger.error('Failed to register drop zone', { error: error.message });
      errorHandler.handleError(error, 'DragDropManager.registerDropZone');
    }
  }

  /**
   * Enable multi-select functionality
   * @param {Array} elements - Elements that can be multi-selected
   */
  enableMultiSelect(elements) {
    try {
      for (const element of elements) {
        element.addEventListener('click', (e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this._toggleSelection(element);
          } else if (e.shiftKey && this.selectedElements.size > 0) {
            e.preventDefault();
            this._selectRange(element);
          } else {
            this._clearSelection();
            this._addToSelection(element);
          }
        });
      }

      this.logger.debug('Multi-select enabled for elements', { count: elements.length });

    } catch (error) {
      this.logger.error('Failed to enable multi-select', { error: error.message });
    }
  }

  /**
   * Start drag operation programmatically
   * @param {HTMLElement} element - Element to drag
   * @param {Object} options - Drag options
   */
  startDrag(element, options = {}) {
    try {
      if (this.dragInProgress) {
        this.logger.warn('Drag already in progress');
        return false;
      }

      const config = element._dragConfig || {};
      if (config.disabled) {
        return false;
      }

      // Setup drag data
      this.dragData = {
        element,
        config,
        startTime: Date.now(),
        startPosition: options.position || { x: 0, y: 0 },
        currentPosition: options.position || { x: 0, y: 0 },
        elements: this.selectedElements.has(element) 
          ? Array.from(this.selectedElements) 
          : [element],
        ghost: null,
        dropZone: null
      };

      // Create ghost element
      this._createGhostElement();

      // Set drag state
      this.dragInProgress = true;
      document.body.classList.add('dragging');

      // Call start callback
      if (config.onStart) {
        config.onStart(this.dragData);
      }

      // Emit event
      eventBus.emit('dragdrop:start', {
        element,
        elements: this.dragData.elements,
        data: config.data
      });

      this.logger.debug('Drag operation started', {
        element: element._dragId,
        elementsCount: this.dragData.elements.length
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to start drag operation', { error: error.message });
      return false;
    }
  }

  /**
   * End drag operation
   * @param {Object} options - End options
   */
  endDrag(options = {}) {
    try {
      if (!this.dragInProgress || !this.dragData) {
        return;
      }

      const { element, config, dropZone } = this.dragData;
      const success = options.success !== false;

      // Handle drop
      if (success && dropZone) {
        this._handleDrop(dropZone);
      } else if (config.revert) {
        this._revertElement();
      }

      // Cleanup ghost element
      this._removeGhostElement();

      // Reset drop zones
      this._resetDropZones();

      // Clear drag state
      this.dragInProgress = false;
      document.body.classList.remove('dragging');

      // Call end callback
      if (config.onEnd) {
        config.onEnd(this.dragData, success);
      }

      // Emit event
      eventBus.emit('dragdrop:end', {
        element,
        elements: this.dragData.elements,
        success,
        dropZone: dropZone?.element
      });

      this.logger.debug('Drag operation ended', {
        success,
        dropZone: dropZone?.element._dropZoneId
      });

      // Clear drag data
      this.dragData = null;

    } catch (error) {
      this.logger.error('Failed to end drag operation', { error: error.message });
    }
  }

  /**
   * Update drag position
   * @param {Object} position - Current position
   */
  updateDragPosition(position) {
    if (!this.dragInProgress || !this.dragData) {
      return;
    }

    try {
      this.dragData.currentPosition = position;

      // Update ghost position
      if (this.dragData.ghost) {
        this.dragData.ghost.style.left = `${position.x + 10}px`;
        this.dragData.ghost.style.top = `${position.y + 10}px`;
      }

      // Handle auto-scroll
      if (this.config.autoScroll) {
        this._handleAutoScroll(position);
      }

      // Check for drop zone
      const dropZone = this._getDropZoneAtPosition(position);
      if (dropZone !== this.dragData.dropZone) {
        this._updateDropZone(dropZone);
      }

      // Call drag callback
      if (this.dragData.config.onDrag) {
        this.dragData.config.onDrag(this.dragData, position);
      }

      eventBus.emit('dragdrop:move', {
        position,
        dropZone: dropZone?.element
      });

    } catch (error) {
      this.logger.error('Failed to update drag position', { error: error.message });
    }
  }

  /**
   * Get selected elements
   * @returns {Array} Selected elements
   */
  getSelectedElements() {
    return Array.from(this.selectedElements);
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this._clearSelection();
  }

  /**
   * Unregister draggable element
   * @param {HTMLElement} element - Element to unregister
   */
  unregisterDraggable(element) {
    try {
      if (!element || !this.activeElements.has(element)) {
        return;
      }

      // Remove event listeners
      this._removeElementEventListeners(element);

      // Remove from active elements
      this.activeElements.delete(element);

      // Remove from selection if selected
      this.selectedElements.delete(element);

      // Remove classes
      element.classList.remove('draggable', 'drag-disabled', 'selected');

      // Clear configuration
      delete element._dragConfig;
      delete element._dragId;

      this.logger.debug('Unregistered draggable element');

    } catch (error) {
      this.logger.error('Failed to unregister draggable element', { error: error.message });
    }
  }

  /**
   * Unregister drop zone
   * @param {HTMLElement} element - Element to unregister
   */
  unregisterDropZone(element) {
    try {
      if (!element || !element._dropZoneId) {
        return;
      }

      const dropZoneId = element._dropZoneId;
      
      // Remove from drop zones map
      this.dropZones.delete(dropZoneId);

      // Remove classes
      element.classList.remove('drop-zone', 'drop-zone-disabled', 'drop-zone-active');

      // Clear configuration
      delete element._dropConfig;
      delete element._dropZoneId;

      this.logger.debug('Unregistered drop zone', { id: dropZoneId });

    } catch (error) {
      this.logger.error('Failed to unregister drop zone', { error: error.message });
    }
  }

  // Private Methods

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for configuration changes
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('ui.')) {
        this._updateConfig();
      }
    });
  }

  /**
   * Setup global event listeners
   * @private
   */
  _setupGlobalEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.dragInProgress) {
        this.endDrag({ success: false });
      }
    });

    // Prevent default drag behavior on images and links
    document.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'A') {
        e.preventDefault();
      }
    });
  }

  /**
   * Setup mouse events for element
   * @private
   */
  _setupMouseEvents(element) {
    let mouseDownPosition = null;
    let dragStarted = false;

    const handleMouseDown = (e) => {
      if (element._dragConfig.disabled) return;

      mouseDownPosition = { x: e.clientX, y: e.clientY };
      dragStarted = false;

      const handleMouseMove = (e) => {
        if (!mouseDownPosition || dragStarted) return;

        const distance = Math.sqrt(
          Math.pow(e.clientX - mouseDownPosition.x, 2) +
          Math.pow(e.clientY - mouseDownPosition.y, 2)
        );

        if (distance > this.config.dragThreshold) {
          dragStarted = true;
          this.startDrag(element, { position: { x: e.clientX, y: e.clientY } });
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        mouseDownPosition = null;
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
      if (this.dragInProgress && this.dragData && this.dragData.element === element) {
        this.updateDragPosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      if (this.dragInProgress && this.dragData && this.dragData.element === element) {
        this.endDrag();
      }
    };

    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Store handlers for cleanup
    element._mouseHandlers = {
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp
    };
  }

  /**
   * Setup touch events for element
   * @private
   */
  _setupTouchEvents(element) {
    let touchStartPosition = null;
    let touchTimer = null;
    let dragStarted = false;

    const handleTouchStart = (e) => {
      if (element._dragConfig.disabled) return;

      const touch = e.touches[0];
      touchStartPosition = { x: touch.clientX, y: touch.clientY };
      dragStarted = false;

      // Long press detection
      touchTimer = setTimeout(() => {
        if (!dragStarted && touchStartPosition) {
          dragStarted = true;
          this.startDrag(element, { 
            position: { x: touch.clientX, y: touch.clientY } 
          });
        }
      }, this.config.touchDelay);

      const handleTouchMove = (e) => {
        if (!touchStartPosition) return;

        const touch = e.touches[0];
        
        if (!dragStarted) {
          const distance = Math.sqrt(
            Math.pow(touch.clientX - touchStartPosition.x, 2) +
            Math.pow(touch.clientY - touchStartPosition.y, 2)
          );

          if (distance > this.config.dragThreshold) {
            clearTimeout(touchTimer);
            dragStarted = true;
            this.startDrag(element, { 
              position: { x: touch.clientX, y: touch.clientY } 
            });
          }
        } else {
          e.preventDefault();
          this.updateDragPosition({ x: touch.clientX, y: touch.clientY });
        }
      };

      const handleTouchEnd = () => {
        clearTimeout(touchTimer);
        
        if (dragStarted && this.dragInProgress) {
          this.endDrag();
        }

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        touchStartPosition = null;
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });

    // Store handlers for cleanup
    element._touchHandlers = {
      touchstart: handleTouchStart
    };
  }

  /**
   * Setup keyboard events for accessibility
   * @private
   */
  _setupKeyboardEvents(element) {
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');
    element.setAttribute('aria-grabbed', 'false');

    const handleKeyDown = (e) => {
      if (element._dragConfig.disabled) return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          this._toggleSelection(element);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (this.selectedElements.has(element)) {
            e.preventDefault();
            this._moveSelection(e.key);
          }
          break;
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    element._keyboardHandlers = { keydown: handleKeyDown };
  }

  /**
   * Remove element event listeners
   * @private
   */
  _removeElementEventListeners(element) {
    // Remove mouse handlers
    if (element._mouseHandlers) {
      element.removeEventListener('mousedown', element._mouseHandlers.mousedown);
      document.removeEventListener('mousemove', element._mouseHandlers.mousemove);
      document.removeEventListener('mouseup', element._mouseHandlers.mouseup);
    }

    // Remove touch handlers
    if (element._touchHandlers) {
      element.removeEventListener('touchstart', element._touchHandlers.touchstart);
    }

    // Remove keyboard handlers
    if (element._keyboardHandlers) {
      element.removeEventListener('keydown', element._keyboardHandlers.keydown);
    }
  }

  /**
   * Create ghost element
   * @private
   */
  _createGhostElement() {
    if (!this.dragData) return;

    const { element, elements, config } = this.dragData;
    
    let ghost;
    if (config.ghost && typeof config.ghost === 'function') {
      ghost = config.ghost(element, elements);
    } else {
      ghost = this._createDefaultGhost(element, elements);
    }

    ghost.classList.add('drag-ghost');
    ghost.style.position = 'fixed';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = this.config.ghostOpacity;

    document.body.appendChild(ghost);
    this.dragData.ghost = ghost;
  }

  /**
   * Create default ghost element
   * @private
   */
  _createDefaultGhost(element, elements) {
    const ghost = element.cloneNode(true);
    
    if (elements.length > 1) {
      // Multi-element ghost
      const badge = document.createElement('div');
      badge.className = 'drag-count-badge';
      badge.textContent = elements.length;
      ghost.appendChild(badge);
    }

    return ghost;
  }

  /**
   * Remove ghost element
   * @private
   */
  _removeGhostElement() {
    if (this.dragData && this.dragData.ghost) {
      document.body.removeChild(this.dragData.ghost);
      this.dragData.ghost = null;
    }
  }

  /**
   * Get drop zone at position
   * @private
   */
  _getDropZoneAtPosition(position) {
    const element = document.elementFromPoint(position.x, position.y);
    if (!element) return null;

    // Check if element or parent is a drop zone
    let current = element;
    while (current) {
      if (current._dropZoneId && this.dropZones.has(current._dropZoneId)) {
        const dropZone = this.dropZones.get(current._dropZoneId);
        
        // Check if drop zone accepts this drag type
        if (this._canAcceptDrop(dropZone)) {
          return dropZone;
        }
      }
      current = current.parentElement;
    }

    return null;
  }

  /**
   * Check if drop zone can accept current drag
   * @private
   */
  _canAcceptDrop(dropZone) {
    if (!this.dragData || dropZone.config.disabled) {
      return false;
    }

    const dragType = this.dragData.config.type;
    return dropZone.config.accepts.includes(dragType) || 
           dropZone.config.accepts.includes('*');
  }

  /**
   * Update current drop zone
   * @private
   */
  _updateDropZone(newDropZone) {
    const oldDropZone = this.dragData.dropZone;

    // Leave old drop zone
    if (oldDropZone) {
      oldDropZone.active = false;
      if (oldDropZone.config.highlight) {
        oldDropZone.element.classList.remove(oldDropZone.config.highlightClass);
      }
      
      if (oldDropZone.config.onDragLeave) {
        oldDropZone.config.onDragLeave(this.dragData, oldDropZone.element);
      }

      eventBus.emit('dragdrop:zone:leave', {
        dropZone: oldDropZone.element,
        dragData: this.dragData
      });
    }

    // Enter new drop zone
    if (newDropZone) {
      newDropZone.active = true;
      if (newDropZone.config.highlight) {
        newDropZone.element.classList.add(newDropZone.config.highlightClass);
      }
      
      if (newDropZone.config.onDragEnter) {
        newDropZone.config.onDragEnter(this.dragData, newDropZone.element);
      }

      eventBus.emit('dragdrop:zone:enter', {
        dropZone: newDropZone.element,
        dragData: this.dragData
      });
    }

    this.dragData.dropZone = newDropZone;
  }

  /**
   * Handle drop operation
   * @private
   */
  _handleDrop(dropZone) {
    try {
      if (dropZone.config.onDrop) {
        const result = dropZone.config.onDrop(this.dragData, dropZone.element);
        if (result === false) {
          // Drop was rejected
          if (this.dragData.config.revert) {
            this._revertElement();
          }
          return;
        }
      }

      eventBus.emit('dragdrop:drop', {
        dragData: this.dragData,
        dropZone: dropZone.element
      });

      this.logger.debug('Drop operation completed', {
        dropZone: dropZone.element._dropZoneId
      });

    } catch (error) {
      this.logger.error('Drop operation failed', { error: error.message });
      if (this.dragData.config.revert) {
        this._revertElement();
      }
    }
  }

  /**
   * Revert element to original position
   * @private
   */
  _revertElement() {
    if (!this.dragData) return;

    // Simple revert animation (in real implementation, use proper animation)
    const { element } = this.dragData;
    element.style.transition = `transform ${this.dragData.config.revertDuration}ms ease`;
    element.style.transform = 'translate(0, 0)';

    setTimeout(() => {
      element.style.transition = '';
      element.style.transform = '';
    }, this.dragData.config.revertDuration);
  }

  /**
   * Reset all drop zones
   * @private
   */
  _resetDropZones() {
    for (const dropZone of this.dropZones.values()) {
      if (dropZone.active) {
        dropZone.active = false;
        if (dropZone.config.highlight) {
          dropZone.element.classList.remove(dropZone.config.highlightClass);
        }
      }
    }
  }

  /**
   * Handle auto-scroll
   * @private
   */
  _handleAutoScroll(position) {
    const scrollSensitivity = this.config.autoScrollSensitivity;
    const viewport = {
      top: window.scrollY,
      left: window.scrollX,
      bottom: window.scrollY + window.innerHeight,
      right: window.scrollX + window.innerWidth
    };

    let scrollX = 0;
    let scrollY = 0;

    // Check boundaries
    if (position.y < viewport.top + scrollSensitivity) {
      scrollY = -10;
    } else if (position.y > viewport.bottom - scrollSensitivity) {
      scrollY = 10;
    }

    if (position.x < viewport.left + scrollSensitivity) {
      scrollX = -10;
    } else if (position.x > viewport.right - scrollSensitivity) {
      scrollX = 10;
    }

    // Perform scroll
    if (scrollX !== 0 || scrollY !== 0) {
      window.scrollBy(scrollX, scrollY);
    }
  }

  /**
   * Selection management
   * @private
   */
  _toggleSelection(element) {
    if (this.selectedElements.has(element)) {
      this._removeFromSelection(element);
    } else {
      this._addToSelection(element);
    }
  }

  _addToSelection(element) {
    this.selectedElements.add(element);
    element.classList.add('selected');
    element.setAttribute('aria-selected', 'true');
    
    eventBus.emit('dragdrop:selection:changed', {
      selected: Array.from(this.selectedElements)
    });
  }

  _removeFromSelection(element) {
    this.selectedElements.delete(element);
    element.classList.remove('selected');
    element.setAttribute('aria-selected', 'false');
    
    eventBus.emit('dragdrop:selection:changed', {
      selected: Array.from(this.selectedElements)
    });
  }

  _clearSelection() {
    for (const element of this.selectedElements) {
      element.classList.remove('selected');
      element.setAttribute('aria-selected', 'false');
    }
    this.selectedElements.clear();
    
    eventBus.emit('dragdrop:selection:cleared');
  }

  _selectRange(endElement) {
    // Simple range selection implementation
    const elements = Array.from(this.activeElements);
    const startIndex = elements.findIndex(el => this.selectedElements.has(el));
    const endIndex = elements.indexOf(endElement);

    if (startIndex !== -1 && endIndex !== -1) {
      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);

      this._clearSelection();
      for (let i = start; i <= end; i++) {
        this._addToSelection(elements[i]);
      }
    }
  }

  _moveSelection(direction) {
    // Keyboard navigation implementation
    // This would depend on the specific layout and requirements
    this.logger.debug('Move selection', { direction });
  }

  /**
   * Create style elements
   * @private
   */
  _createStyleElements() {
    const style = document.createElement('style');
    style.textContent = `
      .draggable {
        cursor: grab;
        user-select: none;
      }
      
      .draggable:active {
        cursor: grabbing;
      }
      
      .draggable.drag-disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      
      .draggable.selected {
        outline: 2px solid #007bff;
        outline-offset: 2px;
      }
      
      .drop-zone {
        transition: background-color 0.2s ease;
      }
      
      .drop-zone.drop-zone-active {
        background-color: rgba(0, 123, 255, 0.1);
        border: 2px dashed #007bff;
      }
      
      .drop-zone.drop-zone-disabled {
        opacity: 0.5;
      }
      
      .drag-ghost {
        transform: rotate(-5deg);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      }
      
      .drag-count-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #dc3545;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 12px;
        font-weight: bold;
        min-width: 20px;
        text-align: center;
      }
      
      .dragging {
        cursor: grabbing !important;
      }
      
      .dragging * {
        cursor: grabbing !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Create visual feedback elements
   * @private
   */
  _createVisualFeedbackElements() {
    // Create insertion indicator
    const indicator = document.createElement('div');
    indicator.id = 'drag-insertion-indicator';
    indicator.style.cssText = `
      position: absolute;
      background: #007bff;
      height: 2px;
      border-radius: 1px;
      display: none;
      z-index: 9998;
    `;
    document.body.appendChild(indicator);
  }

  /**
   * Setup accessibility features
   * @private
   */
  _setupAccessibilityFeatures() {
    // Add live region for screen readers
    const liveRegion = document.createElement('div');
    liveRegion.id = 'drag-drop-announcements';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);

    // Listen for drag events to announce them
    eventBus.on('dragdrop:start', (event) => {
      this._announce(`Started dragging ${event.elements.length} item${event.elements.length > 1 ? 's' : ''}`);
    });

    eventBus.on('dragdrop:zone:enter', (event) => {
      this._announce('Entered drop zone');
    });

    eventBus.on('dragdrop:drop', (event) => {
      this._announce('Item dropped successfully');
    });

    eventBus.on('dragdrop:end', (event) => {
      if (!event.success) {
        this._announce('Drag cancelled');
      }
    });
  }

  /**
   * Announce to screen readers
   * @private
   */
  _announce(message) {
    const liveRegion = document.getElementById('drag-drop-announcements');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return 'drag_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.dragThreshold = configManager.get('ui.dragThreshold', 5);
    this.config.touchDelay = configManager.get('ui.touchDelay', 150);
    this.config.animationDuration = configManager.get('ui.animationDuration', 200);
    this.config.ghostOpacity = configManager.get('ui.ghostOpacity', 0.7);
    this.config.autoScroll = configManager.get('ui.autoScroll', true);
    this.config.autoScrollSensitivity = configManager.get('ui.autoScrollSensitivity', 50);
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const dragDropManager = new DragDropManager();

// Auto-initialize
setTimeout(() => {
  dragDropManager.initialize();
}, 100);

export default dragDropManager;