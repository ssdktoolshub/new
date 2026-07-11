// SSDK Update Engine - Tracks and manages application updates and notifications

export class UpdateEngine {
  constructor() {
    this.core = null;
    this.lastCheckedKey = "ssdk-update-last-checked";
  }

  async init(core) {
    this.core = core;
    this.checkUpdates();
  }

  /**
   * Compares tool manifests to flag recently added tools.
   */
  async checkUpdates() {
    const config = this.core.getEngine("config");
    const notification = this.core.getEngine("notification");
    const lastChecked = localStorage.getItem(this.lastCheckedKey);
    
    // Store current check time
    localStorage.setItem(this.lastCheckedKey, new Date().toISOString());
    if (!lastChecked) return; // Skip if first run

    const tools = await config.getTools();
    const newTools = tools.filter(t => {
      const addedDate = new Date(t.addedDate);
      return addedDate > new Date(lastChecked);
    });

    if (newTools.length > 0 && notification) {
      notification.show(`🎉 ${newTools.length} new tool(s) added! Explore them in the hub.`, "info", 5000);
    }
  }
}
