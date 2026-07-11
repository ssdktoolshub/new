// SSDK State Engine - Centralized Application State Management
// Enforces Single Source of Truth for local storage, session storage, and reactive UI events.

export class StateEngine {
  constructor() {
    this.core = null;
    this.state = {};
    this.prefix = "ssdk-";
  }

  async init(core) {
    this.core = core;
    this._loadInitialState();
    console.log("[StateEngine] Initialized centralized state.");
  }

  _loadInitialState() {
    try {
      this.state = {
        theme: localStorage.getItem(`${this.prefix}theme`) || "dark",
        lang: localStorage.getItem(`${this.prefix}lang`) || "en",
        favorites: JSON.parse(localStorage.getItem(`${this.prefix}tool-favorites`) || "[]"),
        history: JSON.parse(localStorage.getItem(`${this.prefix}tool-history`) || "[]"),
        jwt: localStorage.getItem(`${this.prefix}jwt`) || null,
      };
    } catch (e) {
      console.warn("[StateEngine] Failed to parse initial state, resetting to defaults.");
      this.state = { theme: "dark", lang: "en", favorites: [], history: [], jwt: null };
    }
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    
    // Persist specific keys
    if (key === "theme" || key === "lang" || key === "jwt") {
      if (value === null) {
        localStorage.removeItem(`${this.prefix}${key}`);
      } else {
        localStorage.setItem(`${this.prefix}${key}`, value);
      }
    } else if (key === "favorites") {
      localStorage.setItem(`${this.prefix}tool-favorites`, JSON.stringify(value));
    } else if (key === "history") {
      localStorage.setItem(`${this.prefix}tool-history`, JSON.stringify(value));
    }

    this._dispatch(key, value);
  }

  _dispatch(key, value) {
    const event = new CustomEvent("ssdk-state-change", {
      detail: { key, value }
    });
    window.dispatchEvent(event);
  }

  // Reactive Subscription Helper
  subscribe(key, callback) {
    window.addEventListener("ssdk-state-change", (e) => {
      if (e.detail.key === key) {
        callback(e.detail.value);
      }
    });
  }
}
