/**
 * Debug App.js - Fixed Version
 * 
 * Simplified and more reliable button handling for the dashboard
 */

console.clear();
console.log('🚀 Fixed Debug App Starting...');

// Wait for DOM to be fully loaded
function waitForDOM(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Simple and reliable button handler
function attachButtonHandler(buttonId, action, targetUrl) {
    console.log(`🔧 Attaching handler for button: ${buttonId}`);
    
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error(`❌ Button not found: ${buttonId}`);
        return false;
    }
    
    console.log(`✅ Button found: ${buttonId}`, button);
    
    // Clear any existing handlers
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add click handler
    newButton.addEventListener('click', function(event) {
        console.log(`🎯 Button clicked: ${action}`);
        event.preventDefault();
        event.stopPropagation();
        
        // Visual feedback
        newButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            newButton.style.transform = '';
        }, 150);
        
        if (targetUrl === '#') {
            alert(`${action} functionality coming soon!`);
        } else {
            console.log(`🚀 Navigating to: ${targetUrl}`);
            window.location.href = targetUrl;
        }
    });
    
    // Also add fallback onclick handler
    newButton.onclick = function(event) {
        console.log(`🎯 Onclick fallback triggered: ${action}`);
        event.preventDefault();
        if (targetUrl === '#') {
            alert(`${action} functionality coming soon!`);
        } else {
            window.location.href = targetUrl;
        }
    };
    
    console.log(`✅ Handler attached successfully for: ${buttonId}`);
    return true;
}

// Initialize the dashboard
function initializeDashboard() {
    console.log('🏠 Initializing dashboard...');
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('📄 Current page:', currentPage);
    
    if (currentPage === 'launchpad.html') {
        console.log('📋 Setting up launchpad buttons...');
        
        // Attach handlers for all three buttons
        const buttonConfigs = [
            { id: 'btn-roadmap', action: 'Open Timeline', url: 'index.html' },
            { id: 'btn-details', action: 'Manage Projects', url: 'project-details.html' },
            { id: 'btn-table', action: 'View Table', url: '#' }
        ];
        
        let successCount = 0;
        buttonConfigs.forEach(config => {
            if (attachButtonHandler(config.id, config.action, config.url)) {
                successCount++;
            }
        });
        
        console.log(`✅ Successfully attached ${successCount}/${buttonConfigs.length} button handlers`);
        
        // Emergency fallback - attach handlers to ALL buttons
        const allButtons = document.querySelectorAll('button');
        console.log(`🚨 Found ${allButtons.length} total buttons for fallback`);
        
        allButtons.forEach((btn, index) => {
            if (!btn.hasAttribute('data-fallback-attached')) {
                btn.setAttribute('data-fallback-attached', 'true');
                
                btn.addEventListener('click', function(e) {
                    console.log(`🚨 Fallback handler activated for button ${index}:`, this.textContent);
                    
                    const text = this.textContent.trim();
                    if (text.includes('Timeline')) {
                        window.location.href = 'index.html';
                    } else if (text.includes('Projects')) {
                        window.location.href = 'project-details.html';
                    } else if (text.includes('Table')) {
                        alert('Table view coming soon!');
                    } else {
                        alert('Button clicked: ' + text);
                    }
                });
            }
        });
        
    } else {
        console.log(`📄 Setting up ${currentPage} page...`);
        
        // For other pages, add basic button logging
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach((btn, index) => {
            btn.addEventListener('click', function() {
                console.log(`🎯 Button clicked on ${currentPage}:`, this.textContent);
            });
        });
    }
    
    console.log('✅ Dashboard initialization complete!');
}

// Multiple initialization attempts to ensure reliability
waitForDOM(function() {
    console.log('📖 DOM ready - initializing dashboard...');
    initializeDashboard();
});

// Backup initialization after delay
setTimeout(() => {
    console.log('🔄 Backup initialization after 1 second...');
    initializeDashboard();
}, 1000);

// Debug helpers
window.debugDashboard = {
    listButtons: function() {
        const buttons = document.querySelectorAll('button');
        console.log('🔍 Found buttons:');
        buttons.forEach((btn, i) => {
            console.log(`  ${i}: "${btn.textContent}" (id: ${btn.id || 'none'})`);
        });
        return buttons;
    },
    clickButton: function(index) {
        const buttons = document.querySelectorAll('button');
        if (buttons[index]) {
            console.log(`🔧 Manually clicking button ${index}`);
            buttons[index].click();
        }
    },
    testButton: function(buttonId) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            console.log(`🧪 Testing button: ${buttonId}`);
            btn.click();
        } else {
            console.error(`❌ Button not found: ${buttonId}`);
        }
    }
};

console.log('🎉 Fixed Debug App loaded successfully!');
console.log('💡 Try: debugDashboard.listButtons() or debugDashboard.testButton("btn-roadmap")');