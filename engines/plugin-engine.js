// SSDK Plugin Engine - Handles sandboxed executions of third-party modular tool plugins
// Mounts manifests inside secure iframe sandboxes and bridges communications via postMessage API.

export class PluginEngine {
  constructor() {
    this.core = null;
    this.activePlugins = new Map();
    this.messageListener = null;
  }

  async init(core) {
    this.core = core;
    this.setupMessageBridge();
  }

  setupMessageBridge() {
    // Teardown old listener if resetting
    if (this.messageListener) {
      window.removeEventListener("message", this.messageListener);
    }

    this.messageListener = (event) => {
      // Basic postMessage security filters
      if (event.data && typeof event.data === "object") {
        const { type, action, message, status } = event.data;
        if (type === "ssdk-plugin-event") {
          const notification = this.core.getEngine("notification");
          if (action === "notify" && notification) {
            notification.show(message, status || "info");
          }
          if (action === "log") {
            console.log(`[Plugin Log]`, message);
          }
        }
      }
    };
    window.addEventListener("message", this.messageListener);
  }

  /**
   * Mounts and executes a plugin dynamically inside a sandbox iframe.
   */
  async mountPlugin(pluginId, manifestUrl, containerElement) {
    console.log(`[PluginEngine] Mounting plugin [${pluginId}] from: ${manifestUrl}`);
    
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) throw new Error("Could not load plugin manifest");
      const manifest = await response.json();

      // Create sandboxed frame to run the script securely
      const iframe = document.createElement("iframe");
      iframe.id = `ssdk-plugin-${pluginId}`;
      iframe.className = "ssdk-plugin-frame";
      
      // Sandbox restrictions: allow-scripts for execution, prevent same-origin to isolate cookies/storage
      iframe.sandbox = "allow-scripts allow-downloads";
      iframe.style.width = "100%";
      iframe.style.height = "500px";
      iframe.style.border = "none";
      iframe.style.background = "transparent";

      containerElement.appendChild(iframe);

      // Write sandbox boilerplate page and load manifest logic
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { margin: 0; color: #fff; font-family: sans-serif; background: transparent; overflow-x: hidden; }
            #container { padding: 20px; }
            button { background: #4f46e5; border: none; padding: 10px 16px; border-radius: 8px; color: #fff; cursor: pointer; font-weight: bold; }
          </style>
        </head>
        <body>
          <div id="container">
            <h4 style="margin:0 0 10px 0;">${manifest.name} (Sandboxed)</h4>
            <div id="root"></div>
          </div>
          <script>
            // Helper to talk to parent SSDK frame
            window.ssdk = {
              notify: (msg, status) => {
                window.parent.postMessage({ type: 'ssdk-plugin-event', action: 'notify', message: msg, status }, '*');
              },
              log: (msg) => {
                window.parent.postMessage({ type: 'ssdk-plugin-event', action: 'log', message: msg }, '*');
              }
            };
          </script>
          <script src="${manifest.script}"></script>
        </body>
        </html>
      `);
      doc.close();

      this.activePlugins.set(pluginId, { iframe, manifest });
      return true;
    } catch (e) {
      console.error(`[PluginEngine] Mounting plugin failed:`, e);
      return false;
    }
  }

  unmountPlugin(pluginId) {
    const p = this.activePlugins.get(pluginId);
    if (p && p.iframe) {
      p.iframe.remove();
      this.activePlugins.delete(pluginId);
    }
  }
}
export default PluginEngine;
