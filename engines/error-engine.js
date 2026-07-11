// SSDK Error Engine - Enterprise Global Error Boundary & Logger
// Intercepts window exceptions, API timeouts, and JS crashes.

export class ErrorEngine {
  constructor() {
    this.core = null;
    this.config = null;
    this.notifications = null;
    this.debugMode = false;
  }

  async init(core) {
    this.core = core;
    
    // Defer fetching dependencies to prevent circular loops during boot
    setTimeout(() => {
      this.config = this.core.getEngine("config");
      this.notifications = this.core.getEngine("notification");
      
      if (this.config) {
        const envConfig = this.config.getEnvConfig();
        this.debugMode = envConfig.debug === true;
      }
    }, 500);

    this.bindGlobalHandlers();
    this.log("info", "System", "ErrorEngine initialized successfully.");
  }

  /**
   * Binds to top-level window error events.
   */
  bindGlobalHandlers() {
    window.addEventListener("error", (event) => {
      this.handleGlobalError(event.error || event.message, event.filename, event.lineno);
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.handleGlobalError(event.reason, "PromiseRejection", 0);
    });
  }

  handleGlobalError(error, source, line) {
    // Only log to console, do not spam the UI with toasts for every broken image or silent failure.
    this.log("critical", "Window", `Crash caught: ${error?.message || error}`, { source, line });
  }

  /**
   * Structured logger wrapper
   * @param {string} level 'info' | 'warn' | 'error' | 'critical' | 'debug'
   * @param {string} module The module or engine name
   * @param {string} message Log message
   * @param {object} meta Optional metadata payload
   */
  log(level, module, message, meta = {}) {
    const timestamp = new Date().toISOString();
    
    const payload = {
      timestamp,
      module,
      level,
      message,
      meta
    };

    // Console output mapping
    if (this.debugMode || level === 'error' || level === 'critical') {
      const prefix = `[${timestamp}] [${module.toUpperCase()}]`;
      switch (level) {
        case 'info':
          console.info(`${prefix} ${message}`, meta);
          break;
        case 'warn':
          console.warn(`${prefix} ⚠️ ${message}`, meta);
          break;
        case 'error':
        case 'critical':
          console.error(`${prefix} ❌ ${message}`, meta);
          break;
        case 'debug':
          if (this.debugMode) console.debug(`${prefix} 🐛 ${message}`, meta);
          break;
      }
    }

    // In the future, POST this payload to FastAPI backend telemetry endpoint
    // if (level === 'critical' || level === 'error') {
    //    this.postToTelemetry(payload);
    // }
  }

  /**
   * Helper for API specific try/catch wrapping
   */
  async safeFetch(url, options = {}, module = "API") {
    try {
      this.log("debug", module, `Fetching: ${url}`);
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      this.log("warn", module, `Fetch failed for ${url} (Silent Fallback Mode)`, { error: e.message });
      return null;
    }
  }
}
