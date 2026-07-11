// SSDK History Engine - Tracks and stores recently used tools locally
// Persists visited tool profiles inside a capped queue in localStorage.

export class HistoryEngine {
  constructor() {
    this.core = null;
    this.storageKey = "ssdk-tool-history";
    this.maxHistory = 10;
  }

  async init(core) {
    this.core = core;
  }

  /**
   * Retrieves the history stack.
   */
  getHistory() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("[HistoryEngine] Failed parsing history storage:", e);
      return [];
    }
  }

  /**
   * Appends a new tool visited event to the stack.
   */
  addVisited(tool) {
    if (!tool || !tool.id) return;
    
    let list = this.getHistory();
    // Filter duplicate entries
    list = list.filter(item => item.id !== tool.id);
    
    // Add to front of stack
    list.unshift({
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      url: tool.url,
      visitedAt: new Date().toISOString()
    });

    // Enforce size limits
    if (list.length > this.maxHistory) {
      list.pop();
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      
      // Update UI if rendering history list is currently visible
      const toolEngine = this.core.getEngine("tool");
      if (toolEngine && typeof toolEngine.loadHistoryDisplay === "function") {
        toolEngine.loadHistoryDisplay();
      }
    } catch (e) {
      console.error("[HistoryEngine] Failed to save history entry:", e);
    }
  }

  /**
   * Clears all history records.
   */
  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }
}
