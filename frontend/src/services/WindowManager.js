/**
 * WindowManager.js
 * 
 * A service for managing the state of different windows in the application.
 * This prevents multiple windows (like message windows and meeting windows)
 * from appearing simultaneously.
 */

class WindowManager {
    constructor() {
        if (WindowManager.instance) {
            return WindowManager.instance;
        }

        // Set of currently open windows
        this.openWindows = new Set();
        
        // Map of exclusive window groups - windows in the same group cannot be open simultaneously
        this.exclusiveGroups = {
            'messaging': ['message', 'meeting'],  // Messaging group includes message windows and meeting windows
        };

        // Initialize listeners
        this.listeners = [];
        
        WindowManager.instance = this;
    }

    /**
     * Open a specific window and close any conflicting windows
     * @param {string} windowId - Identifier for the window to open
     */
    openWindow(windowId) {
        if (!windowId) return;
        
        // Find which group this window belongs to (if any)
        let windowGroup = null;
        for (const [group, windows] of Object.entries(this.exclusiveGroups)) {
            if (windows.includes(windowId)) {
                windowGroup = group;
                break;
            }
        }
        
        // If window belongs to a group, close other windows in that group
        if (windowGroup) {
            const groupWindows = this.exclusiveGroups[windowGroup];
            for (const otherWindow of groupWindows) {
                if (otherWindow !== windowId && this.openWindows.has(otherWindow)) {
                    this.closeWindow(otherWindow);
                }
            }
        }
        
        // Open the window
        this.openWindows.add(windowId);
        
        // Notify listeners
        this.notifyListeners();
    }

    /**
     * Close a specific window
     * @param {string} windowId - Identifier for the window to close
     */
    closeWindow(windowId) {
        if (this.openWindows.has(windowId)) {
            this.openWindows.delete(windowId);
            this.notifyListeners();
        }
    }

    /**
     * Close all open windows
     */
    closeAllWindows() {
        this.openWindows.clear();
        this.notifyListeners();
    }

    /**
     * Check if a specific window is open
     * @param {string} windowId - Identifier for the window to check
     * @returns {boolean} True if the window is open
     */
    isWindowOpen(windowId) {
        return this.openWindows.has(windowId);
    }

    /**
     * Get all currently open windows
     * @returns {Array} Array of open window identifiers
     */
    getOpenWindows() {
        return Array.from(this.openWindows);
    }

    /**
     * Add a change listener to be notified of window state changes
     * @param {Function} listener - Callback function to be called when window state changes
     * @returns {Function} Function to remove the listener
     */
    addChangeListener(listener) {
        if (typeof listener === 'function') {
            this.listeners.push(listener);
            
            // Return function to remove this listener
            return () => {
                this.listeners = this.listeners.filter(l => l !== listener);
            };
        }
    }

    /**
     * Notify all registered listeners of state change
     * @private
     */
    notifyListeners() {
        const openWindows = this.getOpenWindows();
        for (const listener of this.listeners) {
            listener(openWindows);
        }
    }
}

// Export as singleton instance
export default new WindowManager();