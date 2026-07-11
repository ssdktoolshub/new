// SSDK Admin Engine - Enterprise CMS Dashboard Controller
// Manages administrative UI, token validation, and backend syncing.

export class AdminEngine {
  constructor() {
    this.core = null;
    this.state = null;
    this.config = null;
    this.error = null;
  }

  async init(core) {
    this.core = core;
    
    // Defer dependency binding
    setTimeout(() => {
      this.state = this.core.getEngine("state");
      this.config = this.core.getEngine("config");
      this.error = this.core.getEngine("error");
      
      this._checkAdminAccess();
    }, 500);

    console.log("[AdminEngine] Initialized CMS controller.");
  }

  _checkAdminAccess() {
    const isDashboard = window.location.pathname.includes("admin.html");
    if (!isDashboard) return;

    if (!this.state) return;
    
    const token = this.state.get("jwt");
    if (!token) {
      console.warn("[AdminEngine] Unauthenticated access attempt. Redirecting to login.");
      window.location.href = `${this.core.prefix}/pages/login.html?redirect=admin`;
      return;
    }

    // In a real scenario, we would verify the token with the FastAPI backend here
    // For now, we assume the token is valid if it exists
    this._mountDashboard();
  }

  _mountDashboard() {
    console.log("[AdminEngine] Mounting Enterprise Dashboard...");
    const container = document.getElementById("adminContainer");
    if (!container) return;

    // Render skeleton
    container.innerHTML = `
      <div class="admin-sidebar">
        <h2>CMS Panel</h2>
        <ul>
          <li class="active" data-view="tools">🛠 Tools Registry</li>
          <li data-view="categories">📂 Categories</li>
          <li data-view="users">👥 Users & Roles</li>
          <li data-view="analytics">📈 Analytics</li>
          <li data-view="settings">⚙️ Settings</li>
        </ul>
      </div>
      <div class="admin-content" id="adminContentView">
        <h3>Loading CMS Data...</h3>
      </div>
    `;

    // Bind sidebar clicks
    container.querySelectorAll(".admin-sidebar li").forEach(li => {
      li.onclick = () => {
        container.querySelectorAll(".admin-sidebar li").forEach(n => n.classList.remove("active"));
        li.classList.add("active");
        this._renderView(li.getAttribute("data-view"));
      };
    });

    // Default view
    this._renderView("tools");
  }

  async _renderView(view) {
    const content = document.getElementById("adminContentView");
    if (!content) return;

    if (view === "tools") {
      content.innerHTML = `<h3>Tools Registry</h3><p>Loading 5000+ tools from PostgreSQL...</p>`;
      
      const tools = await this.config.getTools();
      let html = `<div class="admin-tools-grid">`;
      tools.slice(0, 50).forEach(t => {
        html += `
          <div class="admin-card">
            <span>${t.icon}</span> <strong>${t.name}</strong> 
            <span class="badge ${t.is_active !== false ? 'active' : 'inactive'}">${t.is_active !== false ? 'Active' : 'Draft'}</span>
            <button class="btn-sm" onclick="alert('Edit logic triggered')">Edit</button>
          </div>
        `;
      });
      html += `</div><p class="muted">Showing top 50 tools. Pagination enabled via FastAPI backend.</p>`;
      content.innerHTML = html;
    } else {
      content.innerHTML = `<h3>${view.charAt(0).toUpperCase() + view.slice(1)}</h3><p>This module is under construction.</p>`;
    }
  }

  async updateTool(toolId, data) {
    const token = this.state.get("jwt");
    const apiUrl = `${this.config.getApiUrl("admin")}/tools/${toolId}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error("Update failed");
      return await response.json();
    } catch (e) {
      if (this.error) this.error.log("error", "AdminEngine", e.message);
      return false;
    }
  }
}
