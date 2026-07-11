// SSDK Tool Engine - Loads configurations, renders layouts, and runs tool actions
// Supports dynamic JSON-driven UI rendering and custom ES module logic injection.

import { GlassComponents } from "../components/glass-components.js";

export class ToolEngine {
  constructor() {
    this.core = null;
    this.activeTool = null;
    this.activeModule = null;
  }

  async init(core) {
    this.core = core;
  }

  /**
   * Loads a specific tool configuration and bootstraps its HTML template shell.
   */
  async loadTool(toolId) {
    const configEngine = this.core.getEngine("config");
    const tool = await configEngine.getToolById(toolId);
    if (!tool) {
      console.error(`[ToolEngine] Tool ID not found: ${toolId}`);
      this.core.getEngine("notification")?.show(`Tool not found: ${toolId}`, "error");
      return;
    }

    this.activeTool = tool;
    
    // Add visited log event to HistoryEngine
    const historyEngine = this.core.getEngine("history");
    if (historyEngine) {
      historyEngine.addVisited(tool);
    }

    // Apply SEO metadata
    const seoEngine = this.core.getEngine("seo");
    if (seoEngine) {
      seoEngine.updateMetadata(tool);
    }

    // Fetch the universal tool template HTML
    const templateHTML = await this.fetchTemplate();
    const container = document.body;
    
    // Replace the main page content area
    const contentWrap = document.createElement("div");
    contentWrap.innerHTML = templateHTML;
    
    const mainPage = contentWrap.querySelector("main");
    const existingMain = document.querySelector("main.page");
    if (existingMain) {
      existingMain.replaceWith(mainPage);
    } else {
      container.appendChild(mainPage);
    }

    this.populateMetaInfo(tool);
    this.setupControlButtons();
    await this.mountToolComponents(tool);
    await this.loadToolModule(tool);
    this.loadHistoryDisplay();
    this.loadRelatedTools(tool);
    this.loadFAQ(tool);

    // Trigger theme variables reinforcement
    const themeEngine = this.core.getEngine("theme");
    if (themeEngine) {
      themeEngine.initScrollAnimations();
    }
  }

  async fetchTemplate() {
    const response = await fetch(`${this.core.prefix}/templates/tool-template.html`);
    return await response.text();
  }

  populateMetaInfo(tool) {
    document.getElementById("tool-title").textContent = tool.name;
    document.getElementById("tool-description").textContent = tool.description;
    document.getElementById("tool-breadcrumb-name").textContent = tool.name;
    document.getElementById("cat-breadcrumb-link").textContent = tool.category;
    document.getElementById("cat-breadcrumb-link").href = `${this.core.prefix}/index.html#tools`;
    
    // Bind categories click scroll action
    document.getElementById("cat-breadcrumb-link").onclick = (e) => {
      e.preventDefault();
      sessionStorage.setItem("ssdk-open-category", tool.category);
      window.location.href = `${this.core.prefix}/index.html`;
    };

    // Handle Favorites state
    const favBtn = document.getElementById("tool-fav-btn");
    const favEngine = this.core.getEngine("favorites");
    if (favBtn && favEngine) {
      const isFav = favEngine.isFavorite(tool.id);
      favBtn.classList.toggle("on", isFav);
      favBtn.onclick = async () => {
        await favEngine.toggleFavorite(tool);
        favBtn.classList.toggle("on", favEngine.isFavorite(tool.id));
      };
    }
  }

  setupControlButtons() {
    const runBtn = document.getElementById("btn-run-action");
    const clearBtn = document.getElementById("btn-clear-action");
    const copyBtn = document.getElementById("btn-copy-output");
    const downloadBtn = document.getElementById("btn-download-output");
    const shareBtn = document.getElementById("btn-share-output");

    if (runBtn) runBtn.onclick = () => this.runTool();
    if (clearBtn) {
      clearBtn.onclick = () => {
        this.clearInputs();
        this.clearOutputs();
        this.core.getEngine("notification")?.show("Workspace cleared", "info");
      };
    }

    if (copyBtn) {
      copyBtn.onclick = () => {
        const text = this.getOutputContent();
        if (text) {
          navigator.clipboard.writeText(text);
          this.core.getEngine("notification")?.show("Output copied to clipboard!", "success");
        } else {
          this.core.getEngine("notification")?.show("No output to copy.", "warning");
        }
      };
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => this.downloadOutput();
    }

    if (shareBtn) {
      shareBtn.onclick = async () => {
        const shareData = {
          title: `${this.activeTool.name} - SSDK Tools Hub`,
          text: `Check out this free tool: ${this.activeTool.description}`,
          url: window.location.href
        };
        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(window.location.href);
            this.core.getEngine("notification")?.show("Link copied to clipboard!", "success");
          }
        } catch (err) {
          console.warn("Sharing failed", err);
        }
      };
    }
  }

  async mountToolComponents(tool) {
    const inputsContainer = document.getElementById("tool-inputs-container");
    const optionsContainer = document.getElementById("tool-options-container");
    const outputsContainer = document.getElementById("tool-outputs-container");

    inputsContainer.innerHTML = "";
    optionsContainer.innerHTML = "";
    outputsContainer.innerHTML = "";

    // Check if the tool has a defined UI schema
    if (tool.schema) {
      // Build Inputs
      if (tool.schema.inputs && Array.isArray(tool.schema.inputs)) {
        tool.schema.inputs.forEach(inp => {
          const el = this.renderSchemaField(inp);
          if (el) inputsContainer.appendChild(el);
        });
      }

      // Build Options
      if (tool.schema.options && Array.isArray(tool.schema.options)) {
        tool.schema.options.forEach(opt => {
          const el = this.renderSchemaField(opt);
          if (el) optionsContainer.appendChild(el);
        });
      }

      // Build Outputs
      if (tool.schema.outputs && Array.isArray(tool.schema.outputs)) {
        tool.schema.outputs.forEach(out => {
          const el = this.renderSchemaField(out);
          if (el) {
            // Force readOnly for output textareas/inputs
            const mainField = el.querySelector("textarea, input");
            if (mainField) mainField.readOnly = true;
            outputsContainer.appendChild(el);
          }
        });
      }
    } else {
      // Default fallbacks if no schema is defined
      inputsContainer.appendChild(GlassComponents.createTextarea("toolInput", "Enter text or data here...", "Input Payload"));
      outputsContainer.appendChild(GlassComponents.createTextarea("toolOutput", "Processed output will appear here...", "Output Result"));
      const outputBox = document.getElementById("toolOutput");
      if (outputBox) outputBox.readOnly = true;
    }
  }

  renderSchemaField(field) {
    const { id, type, label, placeholder, defaultValue, options, min, max, step, fileTypes } = field;
    switch (type) {
      case "textarea":
        return GlassComponents.createTextarea(id, placeholder, label, 6, field.required);
      case "text":
      case "number":
      case "date":
      case "color":
        return GlassComponents.createInput(id, type, placeholder, label, defaultValue, field.required);
      case "select":
        return GlassComponents.createSelect(id, options, label, defaultValue);
      case "slider":
        return GlassComponents.createSlider(id, min, max, step, defaultValue, label);
      case "switch":
        return GlassComponents.createSwitch(id, label, defaultValue === "true" || defaultValue === true);
      case "upload":
        return GlassComponents.createUploadZone(id, fileTypes, label);
      default:
        return null;
    }
  }

  async loadToolModule(tool) {
    try {
      const modulePath = `${this.core.prefix}/modules/${tool.id}.js`;
      const { default: ToolModule } = await import(modulePath);
      this.activeModule = new ToolModule();
      if (typeof this.activeModule.init === "function") {
        await this.activeModule.init(this);
      }
      console.log(`[ToolEngine] Custom module loaded: ${tool.id}`);
    } catch (e) {
      console.warn(`[ToolEngine] No custom module logic found at /modules/${tool.id}.js. Running default fallback uppercase transformation.`, e);
      this.activeModule = null;
    }
  }

  async runTool() {
    this.showProgress(true);
    this.hideStatus();

    try {
      if (this.activeModule && typeof this.activeModule.run === "function") {
        await this.activeModule.run(this);
      } else {
        // Fallback processing: convert text to uppercase
        const inputEl = document.getElementById("toolInput");
        const outputEl = document.getElementById("toolOutput");
        if (inputEl && outputEl) {
          const result = inputEl.value.toUpperCase();
          outputEl.value = result;
          this.showStatus("✅ Processed successfully!");
        } else {
          this.showStatus("❌ Default text elements missing. Verify config schema.", true);
        }
      }
    } catch (e) {
      console.error("[ToolEngine] Execution failure:", e);
      this.showStatus(`❌ Execution Error: ${e.message}`, true);
      this.core.getEngine("notification")?.show(`Execution error: ${e.message}`, "error");
    } finally {
      this.showProgress(false);
    }
  }

  getOutputContent() {
    // If custom module overrides getOutput, call it
    if (this.activeModule && typeof this.activeModule.getOutput === "function") {
      return this.activeModule.getOutput(this);
    }
    
    // Fallback: look for a field named 'toolOutput' or use first output container element value
    const defaultOutput = document.getElementById("toolOutput");
    if (defaultOutput) return defaultOutput.value || defaultOutput.textContent || "";

    const outputsContainer = document.getElementById("tool-outputs-container");
    if (outputsContainer) {
      const firstInput = outputsContainer.querySelector("textarea, input");
      if (firstInput) return firstInput.value;
    }
    return "";
  }

  downloadOutput() {
    const text = this.getOutputContent();
    if (!text) {
      this.showStatus("❌ Nothing to download.", true);
      this.core.getEngine("notification")?.show("No output content found to download", "warning");
      return;
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${this.activeTool.id}-output.txt`;
    link.click();
    this.showStatus("📥 File downloaded successfully!");
    this.core.getEngine("notification")?.show("Download triggered", "success");
  }

  clearInputs() {
    document.querySelectorAll("#tool-inputs-container .field-input, #tool-options-container .field-input").forEach(i => {
      if (i.tagName === "INPUT" || i.tagName === "TEXTAREA") {
        i.value = i.defaultValue || "";
      }
    });
    // Reset switch slides aria-checked states
    document.querySelectorAll("#tool-options-container .switch-slider-label").forEach(lbl => {
      const input = document.getElementById(lbl.getAttribute("for"));
      if (input) {
        lbl.setAttribute("aria-checked", input.checked ? "true" : "false");
      }
    });
  }

  clearOutputs() {
    document.querySelectorAll("#tool-outputs-container .field-input").forEach(i => {
      if (i.tagName === "INPUT" || i.tagName === "TEXTAREA") {
        i.value = "";
      } else {
        i.textContent = "";
      }
    });
    this.hideStatus();
    const previewContainer = document.getElementById("tool-preview-container");
    if (previewContainer) {
      previewContainer.innerHTML = "";
      previewContainer.style.display = "none";
    }
  }

  showProgress(show, text = "Processing data...") {
    const el = document.getElementById("tool-progress");
    if (el) {
      el.style.display = show ? "flex" : "none";
      const txt = document.getElementById("progress-text");
      if (txt) txt.textContent = text;
    }
  }

  showStatus(text, isError = false) {
    const badge = document.getElementById("tool-status-badge");
    if (badge) {
      badge.style.display = "block";
      badge.textContent = text;
      badge.className = `status-badge ${isError ? "error" : "success"}`;
    }
  }

  hideStatus() {
    const badge = document.getElementById("tool-status-badge");
    if (badge) badge.style.display = "none";
  }

  loadHistoryDisplay() {
    const list = document.getElementById("tool-history-list");
    if (!list) return;
    list.innerHTML = "";

    const historyEngine = this.core.getEngine("history");
    const historyList = historyEngine ? historyEngine.getHistory() : [];

    if (historyList.length === 0) {
      list.innerHTML = `<p class="empty-msg" style="color: var(--muted); font-size: 0.85rem;">No recently visited tools.</p>`;
      return;
    }

    historyList.slice(0, 5).forEach(item => {
      const a = document.createElement("a");
      a.className = "history-item";
      a.href = `${this.core.prefix}/${item.url}`;
      a.style.display = "flex";
      a.style.alignItems = "center";
      a.style.gap = "8px";
      a.style.textDecoration = "none";
      a.style.color = "var(--text)";
      a.style.padding = "6px 10px";
      a.style.borderRadius = "8px";
      a.style.background = "var(--card)";
      a.style.marginBottom = "6px";
      a.style.fontSize = "0.85rem";
      a.innerHTML = `<span class="icon">${item.icon}</span><span>${item.name}</span>`;
      list.appendChild(a);
    });
  }

  async loadRelatedTools(tool) {
    const grid = document.getElementById("related-tools-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const recEngine = this.core.getEngine("recommendation");
    let related = [];
    
    if (recEngine) {
      related = await recEngine.getRecommendations(tool.id, 4);
    } else {
      const config = this.core.getEngine("config");
      const tools = await config.getTools();
      related = tools
        .filter(t => t.category === tool.category && t.id !== tool.id)
        .slice(0, 4);
    }

    related.forEach(t => {
      const card = document.createElement("a");
      card.className = "card show";
      card.href = `${this.core.prefix}/${t.url}`;
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          <span class="icon">${t.icon}</span>
          <h3>${t.name}</h3>
        </div>
        <p>${t.description}</p>
      `;
      grid.appendChild(card);
    });
  }

  async loadFAQ(tool) {
    const list = document.getElementById("tool-faq-accordion");
    if (!list) return;
    list.innerHTML = "";

    const config = this.core.getEngine("config");
    const siteFAQ = await config.getFAQ();
    const faqs = tool.faq || siteFAQ.slice(0, 3);
    
    faqs.forEach(item => {
      const faqItem = document.createElement("div");
      faqItem.className = "faq-item";
      faqItem.innerHTML = `
        <div class="faq-q">${item.q}<span>＋</span></div>
        <div class="faq-a">${item.a}</div>
      `;
      
      const q = faqItem.querySelector(".faq-q");
      q.onclick = () => {
        const isOpen = faqItem.classList.toggle("open");
        const a = faqItem.querySelector(".faq-a");
        a.style.maxHeight = isOpen ? "250px" : "0";
        a.style.padding = isOpen ? "0 22px 16px" : "0 22px";
      };
      
      list.appendChild(faqItem);
    });
  }
}
