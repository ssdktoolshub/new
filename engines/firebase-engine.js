// SSDK Firebase Engine - Coordinates User Authentication & Firestore cloud backups synchronization
// Initializes Firebase dynamically based on the configuration in settings.json.

export class FirebaseEngine {
  constructor() {
    this.core = null;
    this.auth = null;
    this.db = null;
    this.currentUser = null;
  }

  async init(core) {
    this.core = core;
    
    // Only load Firebase if running on an HTTP/HTTPS server to avoid file:// protocol CORS blocks
    if (window.location.protocol !== "file:") {
      this.loadFirebase(() => this.configureFirebase());
    } else {
      console.log("[FirebaseEngine] Local file protocol detected. Skipping Firebase module load.");
    }
  }

  loadFirebase(callback) {
    if (window.firebase) {
      callback();
      return;
    }
    
    // Dynamically inject Firebase compatibility libraries
    const appScript = document.createElement("script");
    appScript.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js";
    appScript.onload = () => {
      const authScript = document.createElement("script");
      authScript.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js";
      authScript.onload = () => {
        const dbScript = document.createElement("script");
        dbScript.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js";
        dbScript.onload = callback;
        document.head.appendChild(dbScript);
      };
      document.head.appendChild(authScript);
    };
    document.head.appendChild(appScript);
  }

  async configureFirebase() {
    try {
      const configEngine = this.core.getEngine("config");
      const settings = await configEngine.getSettings();
      const config = settings.firebase;

      if (!config) {
        throw new Error("Firebase configuration settings missing in settings.json");
      }

      if (window.firebase && !firebase.apps.length) {
        firebase.initializeApp(config);
      }

      if (window.firebase) {
        this.auth = firebase.auth();
        this.db = firebase.firestore();

        // Listen for auth state transitions
        this.auth.onAuthStateChanged(async (user) => {
          this.currentUser = user;
          console.log("[FirebaseEngine] Auth state changed:", user ? user.email : "Logged Out");
          
          // Sync Favorites
          const favsEngine = this.core.getEngine("favorites");
          if (favsEngine) {
            await favsEngine.syncUser(user, this.db);
          }

          // Update header auth button UI
          this.updateHeaderAuthUI(user);
        });
      }
    } catch (e) {
      console.error("[FirebaseEngine] Configure failed:", e);
    }
  }

  updateHeaderAuthUI(user) {
    const authBtn = document.getElementById("navAuthBtn");
    if (!authBtn) return;

    const prefix = this.core.prefix;
    if (user) {
      authBtn.href = `${prefix}/pages/dashboard.html`;
      authBtn.textContent = user.displayName || user.email.split("@")[0].substring(0, 8) + " (Dash)";
      authBtn.style.border = "1px solid var(--accent)";
      authBtn.style.color = "var(--accent)";
    } else {
      authBtn.href = `${prefix}/pages/login.html`;
      authBtn.textContent = "Login";
      authBtn.style.border = "1px solid var(--border)";
      authBtn.style.color = "var(--text)";
    }
  }

  async logout() {
    if (this.auth) {
      await this.auth.signOut();
      const notification = this.core.getEngine("notification");
      if (notification) {
        notification.show("Logged out successfully", "success");
      }
    }
  }
}
