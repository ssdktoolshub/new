// SSDK Case Converter Tool Module
// Implements text transformations: UPPER, lower, Title, Sentence, camelCase, PascalCase, and URL slugs.

import { SSDKTool } from "../core/sdk.js";
import { GlassComponents } from "../components/glass-components.js";

export default class CaseConverter extends SSDKTool {
  constructor() {
    super();
    this.casingType = "upper"; // default action
  }

  async init(toolEngine) {
    this.engine = toolEngine;
    
    // Customize Inputs and Options dynamically
    const inputsContainer = document.getElementById("tool-inputs-container");
    const optionsContainer = document.getElementById("tool-options-container");
    const outputsContainer = document.getElementById("tool-outputs-container");

    inputsContainer.innerHTML = "";
    optionsContainer.innerHTML = "";
    outputsContainer.innerHTML = "";

    // 1. Create text input area
    const inputArea = GlassComponents.createTextarea(
      "textInput",
      "Type or paste your text here...",
      "Source Text"
    );
    inputsContainer.appendChild(inputArea);

    // Bind real-time character statistics
    const textarea = document.getElementById("textInput");
    textarea.addEventListener("input", () => this.updateStats());

    // 2. Create statistics display panel
    const statsHTML = `
      <div class="stats-row" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
        <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px; text-align: center;">
          <h3 id="statChars" style="font-size: 1.25rem; color: var(--accent);">0</h3>
          <span style="font-size: 0.65rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Characters</span>
        </div>
        <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px; text-align: center;">
          <h3 id="statWords" style="font-size: 1.25rem; color: var(--accent);">0</h3>
          <span style="font-size: 0.65rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Words</span>
        </div>
      </div>
    `;
    optionsContainer.insertAdjacentHTML("beforeend", statsHTML);

    // 3. Create Case Select Option Dropdown
    const select = GlassComponents.createSelect("casingSelect", [
      { value: "upper", text: "UPPERCASE" },
      { value: "lower", text: "lowercase" },
      { value: "title", text: "Title Case" },
      { value: "sentence", text: "Sentence Case" },
      { value: "capitalize", text: "Capitalize Words" },
      { value: "alternating", text: "aLtErNaTiNg CaSe" },
      { value: "camel", text: "camelCase" },
      { value: "pascal", text: "PascalCase" },
      { value: "slug", text: "slug-case-url" },
      { value: "dot", text: "dot.case" }
    ], "Target Casing Type", "upper");
    optionsContainer.appendChild(select);

    // 4. Create standard output result
    const outputArea = GlassComponents.createTextarea(
      "toolOutput",
      "Transformed text output will appear here...",
      "Converted Text Result"
    );
    outputsContainer.appendChild(outputArea);
    document.getElementById("toolOutput").readOnly = true;

    // Reset stats to zero initially
    this.updateStats();
  }

  updateStats() {
    const txt = this.getInputValue("textInput");
    const chars = txt.length;
    const words = txt.trim() === "" ? 0 : txt.trim().split(/\s+/).length;

    const charEl = document.getElementById("statChars");
    const wordEl = document.getElementById("statWords");
    if (charEl) charEl.textContent = chars.toLocaleString();
    if (wordEl) wordEl.textContent = words.toLocaleString();
  }

  async run(toolEngine) {
    const inputVal = this.getInputValue("textInput");
    const actionType = document.getElementById("casingSelect").value;

    if (!inputVal.trim()) {
      this.showStatus("❌ Please enter some text first.", true);
      return;
    }

    this.showProgress(true, "Converting casing type...");
    await new Promise(resolve => setTimeout(resolve, 300)); // subtle animations delay

    let result = "";
    switch (actionType) {
      case "upper":
        result = inputVal.toUpperCase();
        break;
      case "lower":
        result = inputVal.toLowerCase();
        break;
      case "title":
        result = inputVal.replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        break;
      case "sentence":
        result = inputVal.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => {
          return p1 + p2.toUpperCase();
        });
        break;
      case "capitalize":
        result = inputVal.toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase());
        break;
      case "alternating":
        result = inputVal.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
        break;
      case "camel":
        result = this.toCamelPascalCase(inputVal, false);
        break;
      case "pascal":
        result = this.toCamelPascalCase(inputVal, true);
        break;
      case "slug":
        result = inputVal.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
        break;
      case "dot":
        result = inputVal.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, ".");
        break;
    }

    this.setOutputValue(result, "toolOutput");
    this.showProgress(false);
    this.showStatus("✅ Case conversion successfully processed!");
  }

  toCamelPascalCase(str, isPascal) {
    let clean = str.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    if (!clean) return "";
    let parts = clean.split(/\s+/);
    let mapped = parts.map((p, idx) => {
      if (idx === 0 && !isPascal) {
        return p.toLowerCase();
      }
      return p.charAt(0).toUpperCase() + p.substring(1).toLowerCase();
    });
    return mapped.join("");
  }
}
