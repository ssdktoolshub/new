// SSDK Word Counter Tool Module
// Analyzes input text to compute word, character, paragraph counts, and keyword density.

import { SSDKTool } from "../core/sdk.js";
import { GlassComponents } from "../components/glass-components.js";

export default class WordCounter extends SSDKTool {
  constructor() {
    super();
  }

  async init(toolEngine) {
    this.engine = toolEngine;

    const inputsContainer = document.getElementById("tool-inputs-container");
    const optionsContainer = document.getElementById("tool-options-container");
    const outputsContainer = document.getElementById("tool-outputs-container");

    inputsContainer.innerHTML = "";
    optionsContainer.innerHTML = "";
    outputsContainer.innerHTML = "";

    // 1. Create text input area
    const inputArea = GlassComponents.createTextarea(
      "textInput",
      "Type or paste your text here to count statistics...",
      "Source Text"
    );
    inputsContainer.appendChild(inputArea);

    const textarea = document.getElementById("textInput");
    textarea.addEventListener("input", () => this.updateMetrics());

    // 2. Create Metrics Grid inside options area
    const metricsHTML = `
      <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
        <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px; text-align: center;">
          <h3 id="metricWords" style="font-size: 1.2rem; color: var(--accent);">0</h3>
          <span style="font-size: 0.65rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Words</span>
        </div>
        <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px; text-align: center;">
          <h3 id="metricChars" style="font-size: 1.2rem; color: var(--accent);">0</h3>
          <span style="font-size: 0.65rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Characters</span>
        </div>
        <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px; text-align: center;">
          <h3 id="metricLines" style="font-size: 1.2rem; color: var(--accent);">0</h3>
          <span style="font-size: 0.65rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Lines</span>
        </div>
        <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px; text-align: center;">
          <h3 id="metricParagraphs" style="font-size: 1.2rem; color: var(--accent);">0</h3>
          <span style="font-size: 0.65rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Paragraphs</span>
        </div>
      </div>
      
      <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 10px; margin-bottom: 12px; text-align: center;">
        <p style="font-size: 0.8rem; margin: 0; color: var(--muted);">
          ⏱️ Est. Reading Time: <strong id="readTime" style="color: var(--accent);">0s</strong> | Speaking: <strong id="speakTime" style="color: var(--accent);">0s</strong>
        </p>
      </div>
    `;
    optionsContainer.insertAdjacentHTML("beforeend", metricsHTML);

    // 3. Create keyword density list placeholder in output
    const outputArea = GlassComponents.createTextarea(
      "toolOutput",
      "Keyword density metrics will appear here after analysis...",
      "Keyword Density & Frequency Report"
    );
    outputsContainer.appendChild(outputArea);
    document.getElementById("toolOutput").readOnly = true;

    this.updateMetrics();
  }

  updateMetrics() {
    const text = this.getInputValue("textInput");
    
    const chars = text.length;
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const lines = text === "" ? 0 : text.split("\n").length;
    const paragraphs = text.trim() === "" ? 0 : text.split(/\n\s*\n/).filter(Boolean).length;

    // Reading speed average: 225 words per min. Speaking: 150 words per min.
    const readSeconds = Math.round((words / 225) * 60);
    const speakSeconds = Math.round((words / 150) * 60);

    const formatTime = (secs) => {
      if (secs < 60) return `${secs}s`;
      const mins = Math.floor(secs / 60);
      const remainingSecs = secs % 60;
      return `${mins}m ${remainingSecs}s`;
    };

    const wordEl = document.getElementById("metricWords");
    const charEl = document.getElementById("metricChars");
    const lineEl = document.getElementById("metricLines");
    const paraEl = document.getElementById("metricParagraphs");
    const readEl = document.getElementById("readTime");
    const speakEl = document.getElementById("speakTime");

    if (wordEl) wordEl.textContent = words.toLocaleString();
    if (charEl) charEl.textContent = chars.toLocaleString();
    if (lineEl) lineEl.textContent = lines.toLocaleString();
    if (paraEl) paraEl.textContent = paragraphs.toLocaleString();
    if (readEl) readEl.textContent = formatTime(readSeconds);
    if (speakEl) speakEl.textContent = formatTime(speakSeconds);
  }

  async run(toolEngine) {
    const text = this.getInputValue("textInput");
    if (!text.trim()) {
      this.showStatus("❌ Please enter some text first.", true);
      return;
    }

    this.showProgress(true, "Calculating word frequencies...");
    await new Promise(resolve => setTimeout(resolve, 400));

    // Tokenize words and clean them
    const tokens = text.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
    const stopWords = new Set(["the", "and", "a", "of", "to", "is", "in", "it", "that", "this", "for", "on", "with", "as", "at", "by", "an", "be", "was", "are", "or", "from", "your", "with"]);

    const frequencies = {};
    let totalCleanWords = 0;

    tokens.forEach(w => {
      if (!stopWords.has(w)) {
        frequencies[w] = (frequencies[w] || 0) + 1;
        totalCleanWords++;
      }
    });

    const sortedWords = Object.entries(frequencies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // get top 10

    let report = `--- KEYWORD DENSITY REPORT ---\n`;
    if (sortedWords.length === 0) {
      report += `No repeated keywords (length >= 3) detected.\n`;
    } else {
      report += `Top ${sortedWords.length} keywords found:\n\n`;
      sortedWords.forEach(([word, count], index) => {
        const density = ((count / totalCleanWords) * 100).toFixed(1);
        report += `${index + 1}. "${word}" - Count: ${count} (${density}% density)\n`;
      });
    }

    this.setOutputValue(report, "toolOutput");
    this.showProgress(false);
    this.showStatus("✅ Frequencies analyzed!");
  }
}
