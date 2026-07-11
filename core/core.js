// SSDK Core Engine Orchestrator
// Coordinates safe bootstrapping of sub-engines, dependency management, and diagnostics.

import { ConfigEngine } from "../engines/config-engine.js";

export class CoreEngine {
  constructor() {
    this.prefix = this.determineDepth();
    this.config = new ConfigEngine(this.prefix);
    this.config.core = this;
    this.engines = {
      config: this.config
    };
    this.bootTimes = {};
  }

  /**
   * Calculates directory depth dynamically for asset linking.
   */
  determineDepth() {
    const path = window.location.pathname;
    if (path.includes("/pages/") || path.includes("/tools/") || path.includes("/categories/")) {
      return "..";
    }
    return ".";
  }

  /**
   * Registers a sub-engine module.
   */
  registerEngine(name, engineInstance) {
    this.engines[name] = engineInstance;
    console.log(`[CoreEngine] Sub-engine registered: ${name}`);
  }

  /**
   * Bootstraps all active sub-engines in a strict, dependency-safe sequence.
   */
  async init() {
    console.log("[CoreEngine] Initializing SSDK Core in safe sequence...");
    const overallStart = performance.now();
    
    // 1. Initialize Theme first to apply custom properties before paint to prevent flashing
    try {
      if (this.engines["theme"]) {
        const start = performance.now();
        await this.engines["theme"].init(this);
        this.bootTimes["theme"] = performance.now() - start;
      }
    } catch (e) {
      console.error("[CoreEngine] Theme engine failed to initialize:", e);
    }

    // 2. Initialize core utility and data-fetching engines
    const baseEngines = [
      "state",        // Centralized State Manager (Required by everything)
      "error",        // Global Error Boundary & Logger
      "notification", // Loads notification container
      "history",      // Loads local logs history
      "favorites",    // Loads local favorites
      "firebase",     // Triggers firebase network listener
      "python",       // Registers Pyodide or server variables
      "ai",           // Prepares local extraction summaries
      "plugin",       // Ready sandboxes registry
      "update",       // Compares version manifests
      "category",     // Category metadata manager
      "search",       // Indexing
      "seo",          // Pre-configures metadata schemas
      "tool",         // Bootstraps template controllers
      "analytics",    // Prepares user instrumentation hooks
      "admin"         // Enterprise CMS Controller
    ];

    for (const name of baseEngines) {
      const engine = this.engines[name];
      if (engine && typeof engine.init === "function") {
        try {
          const start = performance.now();
          await engine.init(this);
          this.bootTimes[name] = performance.now() - start;
        } catch (e) {
          console.error(`[CoreEngine] Sub-engine [${name}] failed to initialize:`, e);
          // Attempt notification report if notification engine is active
          if (this.engines["notification"]) {
            this.engines["notification"].show(`Engine fail: ${name}`, "error");
          }
        }
      }
    }

    // 3. Initialize Homepage rendering engine
    try {
      if (this.engines["homepage"]) {
        const start = performance.now();
        await this.engines["homepage"].init(this);
        this.bootTimes["homepage"] = performance.now() - start;
      }
    } catch (e) {
      console.error("[CoreEngine] Homepage engine failed:", e);
    }

    // 4. Initialize Router last once all modules are ready to parse current location paths
    try {
      if (this.engines["router"]) {
        const start = performance.now();
        await this.engines["router"].init(this);
        this.bootTimes["router"] = performance.now() - start;
      }
    } catch (e) {
      console.error("[CoreEngine] Router engine failed:", e);
    }

    const duration = performance.now() - overallStart;
    console.log(`[CoreEngine] SSDK Core fully booted in ${duration.toFixed(2)}ms. Diagnostics:`, this.bootTimes);
  }

  /**
   * Retrieval helper for engines.
   */
  getEngine(name) {
    return this.engines[name] || null;
  }
}
