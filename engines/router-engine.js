// SSDK Router Engine - Orchestrates path resolutions and tool views dispatching
// Handles transitions between landing views, tool interfaces, and static sheets.

export class RouterEngine {
  constructor() {
    this.core = null;
    this.currentPath = window.location.pathname;
    this.hash = window.location.hash;
  }

  async init(core) {
    this.core = core;
    await this.resolveRoute();
    
    // Bind routing listeners
    window.addEventListener("hashchange", () => {
      this.hash = window.location.hash;
      this.resolveRoute();
    });
  }

  /**
   * Evaluates the current page and dispatches execution tasks.
   */
  async resolveRoute() {
    this.currentPath = window.location.pathname;
    const isToolPage = this.currentPath.includes("/tools/") && !this.currentPath.includes("tool-template.html");
    const isStaticPage = this.currentPath.includes("/pages/");
    
    if (isToolPage) {
      // Extract the tool file basename as the ID
      const toolId = this.currentPath.split("/").pop().replace(".html", "");
      const toolEngine = this.core.getEngine("tool");
      if (toolEngine) {
        await toolEngine.loadTool(toolId);
      }
    } else if (isStaticPage) {
      console.log(`[RouterEngine] Routed to static page: ${this.currentPath}`);
    } else {
      // Landing page or other static sheets
      this.handleHashScrolls();
    }
  }

  handleHashScrolls() {
    if (this.hash) {
      setTimeout(() => {
        const target = document.querySelector(this.hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  }

  /**
   * Standardized redirect logic.
   */
  navigateTo(url) {
    window.location.href = url;
  }
}
