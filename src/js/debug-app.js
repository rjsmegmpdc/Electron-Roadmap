/**
 * Debug App.js - Bulletproof Version with Extensive Debugging
 * 
 * This version has extensive logging, multiple fallbacks, and step-by-step verification
 * to ensure buttons work no matter what.
 */

// STEP 1: Basic logging setup
console.clear();
console.log('='.repeat(50));
console.log('🚀 DEBUG APP STARTING - Bulletproof Version');
console.log('='.repeat(50));

// STEP 2: Environment checks
console.log('🔍 STEP 2: Environment Check');
console.log('- Document ready state:', document.readyState);
console.log('- Current URL:', window.location.href);
console.log('- Current page:', window.location.pathname);
console.log('- User agent:', navigator.userAgent);

// STEP 3: Global error handling
window.addEventListener('error', (e) => {
  console.error('❌ GLOBAL ERROR:', e.error);
  console.error('❌ Error details:', {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno
  });
});

// STEP 4: Test basic JavaScript functionality
console.log('🔍 STEP 4: Basic JavaScript Test');
const testFunction = () => {
  console.log('✅ JavaScript functions work');
  return 'success';
};
const testResult = testFunction();
console.log('- Function test result:', testResult);

// STEP 5: Test DOM access
console.log('🔍 STEP 5: DOM Access Test');
console.log('- Document:', !!document);
console.log('- Document.body:', !!document.body);
console.log('- Document.getElementById:', typeof document.getElementById);

// STEP 6: Manual button finding with multiple methods
function findButtonsMultipleWays() {
  console.log('🔍 STEP 6: Finding Buttons Multiple Ways');
  
  const methods = {
    getElementById_roadmap: document.getElementById('btn-roadmap'),
    getElementById_details: document.getElementById('btn-details'),
    getElementById_table: document.getElementById('btn-table'),
    querySelector_roadmap: document.querySelector('#btn-roadmap'),
    querySelector_details: document.querySelector('#btn-details'),
    querySelector_table: document.querySelector('#btn-table'),
    querySelectorAll_buttons: document.querySelectorAll('button'),
    getElementsByTagName_buttons: document.getElementsByTagName('button')
  };
  
  console.log('Button finding results:');
  Object.entries(methods).forEach(([method, result]) => {
    if (method.includes('All') || method.includes('getElementsByTagName')) {
      console.log(`- ${method}:`, result?.length || 0, 'elements');
    } else {
      console.log(`- ${method}:`, !!result);
    }
  });
  
  return methods;
}

// STEP 7: Try to attach events in multiple ways
function attachEventMultipleWays(element, eventType, handler, elementName) {
  if (!element) {
    console.warn(`⚠️ Cannot attach event to ${elementName} - element not found`);
    return false;
  }
  
  console.log(`🔧 Attaching ${eventType} to ${elementName}:`, element);
  
  try {
    // Method 1: addEventListener
    element.addEventListener(eventType, handler);
    console.log(`✅ addEventListener attached to ${elementName}`);
    
    // Method 2: Direct property assignment (backup)
    element[`on${eventType}`] = handler;
    console.log(`✅ Direct on${eventType} attached to ${elementName}`);
    
    // Method 3: Inline style cursor to show it's clickable
    element.style.cursor = 'pointer';
    console.log(`✅ Cursor style set for ${elementName}`);
    
    // Method 4: Add visual feedback
    element.style.transition = 'all 0.2s ease';
    
    // Method 5: Test immediate click
    element.addEventListener('mousedown', () => {
      console.log(`🎯 MOUSEDOWN detected on ${elementName}`);
    });
    
    element.addEventListener('mouseup', () => {
      console.log(`🎯 MOUSEUP detected on ${elementName}`);
    });
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to attach event to ${elementName}:`, error);
    return false;
  }
}

// STEP 8: Create bulletproof event handlers
function createBulletproofHandler(action, targetUrl) {
  return function(event) {
    console.log(`🎯🎯🎯 BUTTON CLICKED: ${action}`);
    console.log('- Event:', event);
    console.log('- Target:', event.target);
    console.log('- Current target:', event.currentTarget);
    
    // Prevent any default behavior
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
    
    // Visual feedback
    event.target.style.backgroundColor = '#007bff';
    event.target.style.color = 'white';
    
    setTimeout(() => {
      event.target.style.backgroundColor = '';
      event.target.style.color = '';
    }, 200);
    
    // Show alert first
    alert(`Button clicked: ${action}!\nWill navigate to: ${targetUrl}`);
    
    // Navigate after a short delay
    setTimeout(() => {
      console.log(`🚀 Navigating to: ${targetUrl}`);
      window.location.href = targetUrl;
    }, 500);
  };
}

// STEP 9: Initialize with extensive checking
function initializeBulletproof() {
  console.log('🔍 STEP 9: Bulletproof Initialization');
  
  // Find buttons
  const buttons = findButtonsMultipleWays();
  
  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  console.log('- Current page identified as:', currentPage);
  
  if (currentPage === 'launchpad.html') {
    console.log('📋 Initializing LAUNCHPAD page');
    
    // Button 1: Timeline/Roadmap
    const btnRoadmap = buttons.getElementById_roadmap || buttons.querySelector_roadmap;
    if (btnRoadmap) {
      console.log('✅ Found roadmap button:', btnRoadmap);
      const handler = createBulletproofHandler('Open Timeline', 'index.html');
      attachEventMultipleWays(btnRoadmap, 'click', handler, 'roadmap button');
    } else {
      console.error('❌ Roadmap button not found!');
    }
    
    // Button 2: Project Details
    const btnDetails = buttons.getElementById_details || buttons.querySelector_details;
    if (btnDetails) {
      console.log('✅ Found details button:', btnDetails);
      const handler = createBulletproofHandler('Manage Projects', 'project-details.html');
      attachEventMultipleWays(btnDetails, 'click', handler, 'details button');
    } else {
      console.error('❌ Details button not found!');
    }
    
    // Button 3: Table
    const btnTable = buttons.getElementById_table || buttons.querySelector_table;
    if (btnTable) {
      console.log('✅ Found table button:', btnTable);
      const handler = createBulletproofHandler('View Table', '#');
      attachEventMultipleWays(btnTable, 'click', handler, 'table button');
    } else {
      console.error('❌ Table button not found!');
    }
    
    // Emergency fallback: attach to ALL buttons
    const allButtons = document.querySelectorAll('button');
    console.log(`🚨 EMERGENCY FALLBACK: Found ${allButtons.length} total buttons`);
    allButtons.forEach((btn, index) => {
      console.log(`- Button ${index}:`, btn.id || btn.className || btn.textContent);
      
      if (!btn.hasAttribute('data-emergency-handler')) {
        btn.setAttribute('data-emergency-handler', 'true');
        btn.addEventListener('click', function(e) {
          console.log('🚨 EMERGENCY HANDLER TRIGGERED!');
          console.log('- Button clicked:', this);
          console.log('- Button text:', this.textContent);
          alert('Emergency handler activated!\nButton: ' + this.textContent);
        });
        
        // Also try onclick
        btn.onclick = function(e) {
          console.log('🚨 ONCLICK HANDLER TRIGGERED!');
          alert('Onclick handler activated!\nButton: ' + this.textContent);
        };
      }
    });
    
  } else {
    console.log(`📋 Different page detected: ${currentPage}`);
    // For non-launchpad pages, still attach emergency handlers
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach((btn, index) => {
      btn.addEventListener('click', function(e) {
        console.log(`🎯 Button clicked on ${currentPage}:`, this.textContent);
        alert('Button clicked: ' + this.textContent);
      });
    });
  }
  
  console.log('✅ Bulletproof initialization complete!');
}

// STEP 10: Multiple initialization attempts
console.log('🔍 STEP 10: Multiple Initialization Attempts');

// Attempt 1: Immediate
console.log('🔄 Attempt 1: Immediate initialization');
try {
  initializeBulletproof();
} catch (error) {
  console.error('❌ Immediate initialization failed:', error);
}

// Attempt 2: DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 Attempt 2: DOMContentLoaded initialization');
  try {
    initializeBulletproof();
  } catch (error) {
    console.error('❌ DOMContentLoaded initialization failed:', error);
  }
});

// Attempt 3: Window Load
window.addEventListener('load', () => {
  console.log('🔄 Attempt 3: Window load initialization');
  try {
    initializeBulletproof();
  } catch (error) {
    console.error('❌ Window load initialization failed:', error);
  }
});

// Attempt 4: Delayed initialization
setTimeout(() => {
  console.log('🔄 Attempt 4: Delayed initialization (500ms)');
  try {
    initializeBulletproof();
  } catch (error) {
    console.error('❌ Delayed initialization failed:', error);
  }
}, 500);

// Attempt 5: Very delayed initialization
setTimeout(() => {
  console.log('🔄 Attempt 5: Very delayed initialization (2000ms)');
  try {
    initializeBulletproof();
  } catch (error) {
    console.error('❌ Very delayed initialization failed:', error);
  }
}, 2000);

// STEP 11: Manual testing function
window.testButtons = function() {
  console.log('🧪 MANUAL BUTTON TEST');
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach((btn, index) => {
    console.log(`Button ${index}:`, {
      id: btn.id,
      text: btn.textContent,
      className: btn.className,
      onclick: !!btn.onclick,
      hasEventListener: btn.hasAttribute('data-emergency-handler')
    });
  });
};

// STEP 12: Add global debug helpers
window.debugRoadmap = {
  findAllButtons: () => document.querySelectorAll('button'),
  clickButton: (index) => {
    const buttons = document.querySelectorAll('button');
    if (buttons[index]) {
      console.log('🔧 Manually clicking button:', buttons[index]);
      buttons[index].click();
    }
  },
  attachEmergencyHandler: (buttonIndex) => {
    const buttons = document.querySelectorAll('button');
    if (buttons[buttonIndex]) {
      buttons[buttonIndex].onclick = () => alert('Manual handler attached!');
      console.log('✅ Emergency handler attached to button', buttonIndex);
    }
  }
};

console.log('='.repeat(50));
console.log('🎉 DEBUG APP LOADED SUCCESSFULLY');
console.log('💡 Try: window.testButtons() or window.debugRoadmap');
console.log('='.repeat(50));