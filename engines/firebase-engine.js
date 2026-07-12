// SSDK Firebase Engine - Coordinates User Authentication & Cloud Sync
// REWRITTEN TO USE SUPABASE AUTH UNDER THE HOOD

export class FirebaseEngine {
  constructor() {
    this.core = null;
    this.auth = null;
    this.supabase = null;
    this.currentUser = null;
    
    this.SUPABASE_URL = "https://wyqdfwtslkfzmorvggdq.supabase.co";
    this.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cWRmd3RzbGtmem1vcnZnZ2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzQ5MTYsImV4cCI6MjA5OTM1MDkxNn0.I1CPWLqtv-p3XBC2F_6f-IEBbr0M_G6JkB76vc1ZR8A";
  }

  async init(core) {
    this.core = core;
    
    if (window.location.protocol !== "file:") {
      this.loadSupabase(() => this.configureSupabase());
    } else {
      console.log("[AuthEngine] Local file protocol detected. Skipping module load.");
    }
  }

  loadSupabase(callback) {
    if (window.supabaseClient) {
      callback();
      return;
    }
    
    import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm')
      .then(module => {
        window.supabaseClient = module.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
        callback();
      })
      .catch(err => console.error("Failed to load Supabase module", err));
  }

  async configureSupabase() {
    try {
      if (window.supabaseClient) {
        this.supabase = window.supabaseClient;
        this.auth = this.supabase.auth;

        // Listen for auth state transitions
        this.auth.onAuthStateChange(async (event, session) => {
          const user = session ? session.user : null;
          this.currentUser = user;
          console.log("[AuthEngine] Auth state changed:", user ? user.email || user.phone : "Logged Out");
          
          // Sync Favorites (Requires backend/Supabase schema for favorites if used)
          // For now, keep the interface consistent
          const favsEngine = this.core.getEngine("favorites");
          if (favsEngine && typeof favsEngine.syncUser === "function") {
            // Passing supabase client as db for syncing if they ever implement it
            await favsEngine.syncUser(user, this.supabase);
          }

          // Update header auth button UI
          this.updateHeaderAuthUI(user);
        });
        
        // Initial check
        const { data: { session } } = await this.auth.getSession();
        if (session && session.user) {
          this.currentUser = session.user;
          this.updateHeaderAuthUI(session.user);
        }
      }
    } catch (e) {
      console.error("[AuthEngine] Configure failed:", e);
    }
  }

  updateHeaderAuthUI(user) {
    const authBtn = document.getElementById("navAuthBtn");
    if (!authBtn) return;

    const prefix = this.core.prefix || ".";
    if (user) {
      authBtn.href = `${prefix}/pages/dashboard.html`;
      const displayName = user.user_metadata?.full_name || (user.email ? user.email.split("@")[0].substring(0, 8) : "User");
      authBtn.textContent = displayName + " (Dash)";
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
      
      // If we are on dashboard or admin page, redirect to home
      if(window.location.pathname.includes("dashboard") || window.location.pathname.includes("admin")) {
        window.location.href = this.core.prefix + "/index.html";
      } else {
        window.location.reload();
      }
    }
  }
}
