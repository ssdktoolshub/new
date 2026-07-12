// SSDK Config Engine - Manifest Database Loader & Parser
// Configures and caches database objects from the /assets/json/ store, merging Firestore items.

export class ConfigEngine {
  constructor(prefix = ".") {
    this.prefix = prefix;
    this.cache = {};
  }

  /**
   * Loads a JSON config file from the assets/json database.
   */
  async loadJSON(filename) {
    if (this.cache[filename]) {
      return this.cache[filename];
    }
    
    try {
      const response = await fetch(`${this.prefix}/assets/json/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} loading ${filename}`);
      }
      const data = await response.json();
      this.cache[filename] = data;
      return data;
    } catch (e) {
      console.error(`[ConfigEngine] Failed to load JSON manifest [${filename}]:`, e);
      return null;
    }
  }

  /**
   * Fetches the entire tools registry index database.
   * Hybrid Architecture: Tries Live FastAPI first -> Falls back to Static JSON.
   */
  async getTools() {
    await this.getSettings();
    let tools = [];
    
    // 1. Attempt Enterprise API Fetch First
    const apiUrl = this.getApiUrl("tools");
    if (apiUrl) {
      try {
        const errorEngine = this.core ? this.core.getEngine("error") : null;
        if (errorEngine && typeof errorEngine.safeFetch === "function") {
          const apiResponse = await errorEngine.safeFetch(apiUrl, {}, "ConfigEngine");
          if (apiResponse && Array.isArray(apiResponse)) {
            tools = apiResponse;
            errorEngine.log("info", "ConfigEngine", "Tools loaded from Live FastAPI backend.");
          }
        }
      } catch (err) {
        console.warn("[ConfigEngine] API unreachable, falling back to static JSON.", err);
      }
    }
    
    // 2. Fallback to Static Registry if API fails
    if (!tools || tools.length === 0) {
      tools = await this.loadJSON("tools.json") || [];
    }
    
    // 3. Merge Firebase Dynamic Tools (Backward Compatibility)
    const firebaseEngine = this.core ? this.core.getEngine("firebase") : null;
    if (firebaseEngine && firebaseEngine.db) {
      try {
        const snap = await firebaseEngine.db.collection("tools").get();
        const dynamicTools = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.n || data.name,
            category: data.cat || data.category,
            description: data.d || data.description,
            icon: data.i || data.icon,
            url: data.u || data.url,
            type: data.type || "js",
            featured: data.featured || false,
            addedDate: data.addedDate || new Date().toISOString().split("T")[0]
          };
        });
        
        // Merge without duplicate IDs
        const merged = [...tools];
        dynamicTools.forEach(t => {
          if (!merged.some(m => m.id === t.id)) {
            merged.push(t);
          }
        });
        return merged;
      } catch (err) {
        console.warn("[ConfigEngine] Failed to load dynamic tools, using current set:", err);
      }
    }
    return tools;
  }

  /**
   * Fetches the list of active categories.
   * Hybrid Architecture: Tries Live FastAPI first -> Falls back to Static JSON.
   */
  async getCategories() {
    await this.getSettings();
    const apiUrl = this.getApiUrl("categories");
    if (apiUrl) {
      try {
        const errorEngine = this.core ? this.core.getEngine("error") : null;
        if (errorEngine && typeof errorEngine.safeFetch === "function") {
          const apiResponse = await errorEngine.safeFetch(apiUrl, {}, "ConfigEngine");
          if (apiResponse && Array.isArray(apiResponse) && apiResponse.length > 0) {
            return apiResponse;
          }
        }
      } catch (err) {}
    }
    return await this.loadJSON("categories.json") || [];
  }

  /**
   * Fetches FAQ schemas.
   */
  async getFAQ() {
    return await this.loadJSON("faq.json") || [];
  }

  /**
   * Fetches global application configurations and resolves active environment.
   */
  async getSettings() {
    if (!this.settings) {
      this.settings = await this.loadJSON("settings.json") || {};
      this.resolveEnvironment();
    }
    return this.settings;
  }

  /**
   * Detects active environment based on hostname matching.
   */
  resolveEnvironment() {
    this.env = "production";
    const host = window.location.hostname;
    
    if (this.settings && this.settings.environments) {
      for (const [envName, envConfig] of Object.entries(this.settings.environments)) {
        if (envConfig.hostnames && envConfig.hostnames.includes(host)) {
          this.env = envName;
          this.envConfig = envConfig;
          break;
        }
      }
      if (!this.envConfig) this.envConfig = this.settings.environments["production"];
    }
  }

  getEnv() { return this.env || "production"; }
  getEnvConfig() { return this.envConfig || {}; }
  
  getApiUrl(endpoint) {
    // Enterprise Production API URL
    const base = "https://ssdk-backend.onrender.com/api/v1";
    
    const endpoints = {
      tools: `${base}/tools`,
      categories: `${base}/categories`,
      admin: `${base}/admin`,
      medical: `${base}/medical`,
      ai: `${base}/ai`
    };
    return endpoints[endpoint] || null;
  }

  isFeatureEnabled(flag) {
    return this.settings?.features?.[flag] === true;
  }

  getThemeConfig() {
    return this.settings?.theme || {};
  }

  getSeoDefaults() {
    return this.settings?.seo || {};
  }

  // ==========================================
  // SaaS Auth API Connectors (JWT Integration)
  // ==========================================
  
  async login(email, password) {
    const apiUrl = this.getApiUrl("auth");
    if (!apiUrl) throw new Error("Auth API not configured.");
    
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
    
    if (!response.ok) throw new Error("Invalid credentials");
    
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("ssdk_jwt", data.access_token);
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem("ssdk_jwt");
    // Trigger router reload or event
    if (this.core && this.core.getEngine("notification")) {
      this.core.getEngine("notification").show("Logged out successfully.", "info");
    }
  }

  getSessionToken() {
    return localStorage.getItem("ssdk_jwt") || null;
  }

  /**
   * Fetches the navigation schema.
   */
  async getNavigation() {
    return await this.loadJSON("navigation.json") || [];
  }

  /**
   * Fetches a specific tool details by its string ID identifier.
   */
  async getToolById(toolId) {
    const tools = await this.getTools();
    return tools.find(t => t.id === toolId || t.url === `tools/${toolId}.html` || t.url.endsWith(`/${toolId}.html`)) || null;
  }
}
export default ConfigEngine;
