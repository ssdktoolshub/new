// SSDK QR Code Generator Tool Module
// Implements advanced QR Code generation with logo overlay, customized dot styles, and client-side test scan.

import { SSDKTool } from "../core/sdk.js";
import { GlassComponents } from "../components/glass-components.js";

export default class QRCodeGenerator extends SSDKTool {
  constructor() {
    super();
    this.currentType = "url";
    this.currentDot = "square";
    this.logoDataUrl = "";
    this.finalCanvas = null;
    this.qrcodejsLoaded = false;
    this.jsqrLoaded = false;
  }

  async init(toolEngine) {
    this.engine = toolEngine;

    const inputsContainer = document.getElementById("tool-inputs-container");
    const optionsContainer = document.getElementById("tool-options-container");
    const outputsContainer = document.getElementById("tool-outputs-container");

    inputsContainer.innerHTML = "";
    optionsContainer.innerHTML = "";
    outputsContainer.innerHTML = "";

    // 1. Dynamic layout tabs switcher inside options area
    const tabsHTML = `
      <div class="qr-type-tabs" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
        <button class="qr-type-tab active" data-type="url" style="padding: 6px 12px; border-radius: 15px; border: 1px solid var(--border); background: var(--bg3); color: var(--text); font-size: 0.8rem; font-weight: 700; cursor: pointer;">🌐 URL</button>
        <button class="qr-type-tab" data-type="wifi" style="padding: 6px 12px; border-radius: 15px; border: 1px solid var(--border); background: var(--bg3); color: var(--muted); font-size: 0.8rem; font-weight: 700; cursor: pointer;">📶 WiFi</button>
        <button class="qr-type-tab" data-type="text" style="padding: 6px 12px; border-radius: 15px; border: 1px solid var(--border); background: var(--bg3); color: var(--muted); font-size: 0.8rem; font-weight: 700; cursor: pointer;">📄 Plain Text</button>
        <button class="qr-type-tab" data-type="email" style="padding: 6px 12px; border-radius: 15px; border: 1px solid var(--border); background: var(--bg3); color: var(--muted); font-size: 0.8rem; font-weight: 700; cursor: pointer;">✉️ Email</button>
      </div>
    `;
    inputsContainer.insertAdjacentHTML("beforeend", tabsHTML);

    // 2. Input Fields Section
    const fieldsHTML = `
      <div id="qr-fields-area">
        <!-- URL Input -->
        <div class="qr-panel active" id="panel-url">
          <div class="field-grid-1">
            <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Website URL</label>
            <input class="field-input" id="qr-url-val" type="url" placeholder="https://example.com" value="https://google.com" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); outline: none;">
          </div>
        </div>
        
        <!-- WiFi Input -->
        <div class="qr-panel" id="panel-wifi" style="display: none;">
          <div class="field-grid-1" style="margin-bottom: 10px;">
            <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Network SSID</label>
            <input class="field-input" id="qr-wifi-ssid" type="text" placeholder="MyWiFiNetwork" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); outline: none;">
          </div>
          <div class="field-grid-1" style="margin-bottom: 10px;">
            <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">WiFi Password</label>
            <input class="field-input" id="qr-wifi-pass" type="text" placeholder="password123" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); outline: none;">
          </div>
        </div>

        <!-- Plain Text Input -->
        <div class="qr-panel" id="panel-text" style="display: none;">
          <div class="field-grid-1">
            <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Plain Text Payload</label>
            <textarea class="field-input" id="qr-text-val" rows="3" placeholder="Enter custom message..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); outline: none;"></textarea>
          </div>
        </div>

        <!-- Email Input -->
        <div class="qr-panel" id="panel-email" style="display: none;">
          <div class="field-grid-1" style="margin-bottom: 10px;">
            <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">To (Email)</label>
            <input class="field-input" id="qr-email-to" type="email" placeholder="hello@example.com" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); outline: none;">
          </div>
          <div class="field-grid-1">
            <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Subject</label>
            <input class="field-input" id="qr-email-subject" type="text" placeholder="General Enquiry" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); outline: none;">
          </div>
        </div>
      </div>
    `;
    inputsContainer.insertAdjacentHTML("beforeend", fieldsHTML);

    // Bind tab clicks switcher
    inputsContainer.querySelectorAll(".qr-type-tab").forEach(tab => {
      tab.onclick = () => {
        inputsContainer.querySelectorAll(".qr-type-tab").forEach(t => {
          t.classList.remove("active");
          t.style.color = "var(--muted)";
        });
        inputsContainer.querySelectorAll(".qr-panel").forEach(p => p.style.display = "none");
        
        tab.classList.add("active");
        tab.style.color = "var(--text)";
        
        this.currentType = tab.dataset.type;
        document.getElementById(`panel-${this.currentType}`).style.display = "block";
      };
    });

    // 3. Create options (size, color, dot styling, brand logo)
    const optionsHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div>
          <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Dots / Fore</label>
          <input type="color" id="qrColorFore" value="#000000" style="width: 100%; height: 40px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; background: var(--bg2); padding: 3px;">
        </div>
        <div>
          <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Background</label>
          <input type="color" id="qrColorBack" value="#ffffff" style="width: 100%; height: 40px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; background: var(--bg2); padding: 3px;">
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Dot Style Shape</label>
        <select id="qrDotStyle" class="field-input" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); outline: none;">
          <option value="square">Square Blocks</option>
          <option value="rounded">Rounded Squares</option>
          <option value="circle">Circles</option>
        </select>
      </div>

      <div style="margin-bottom: 12px;">
        <label class="field-label" style="font-size: 0.8rem; font-weight: 700; color: var(--muted); display: block; margin-bottom: 4px;">Overlay Logo Image (Optional)</label>
        <input type="file" id="qrLogoFile" accept="image/*" class="field-input" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg2); color: var(--text); outline: none;">
      </div>
    `;
    optionsContainer.insertAdjacentHTML("beforeend", optionsHTML);

    // Bind Logo select file load
    const logoFile = document.getElementById("qrLogoFile");
    logoFile.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.logoDataUrl = ev.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.logoDataUrl = "";
      }
    };

    // 4. Create outputs preview canvas target
    outputsContainer.innerHTML = `
      <div id="qr-output-workspace" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px; background: var(--bg3); border: 1px dashed var(--border); border-radius: 12px; padding: 20px;">
        <div id="qrCanvasContainer" style="background: #ffffff; padding: 14px; border-radius: 12px; display: none;"></div>
        <p id="qrPlaceholder" style="color: var(--muted); font-size: 0.85rem; text-align: center; margin: 0;">Configure parameters and hit run to generate QR Code...</p>
      </div>
    `;

    // Load libraries
    await this.loadLibraries();
  }

  async loadLibraries() {
    // 1. Load qrcodejs dynamically
    if (!window.QRCode) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
      this.qrcodejsLoaded = true;
    }

    // 2. Load jsqr dynamically
    if (!window.jsQR) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
      this.jsqrLoaded = true;
    }
  }

  buildDataPayload() {
    switch (this.currentType) {
      case "url":
        return document.getElementById("qr-url-val").value.trim();
      case "wifi":
        const ssid = document.getElementById("qr-wifi-ssid").value.trim();
        const pass = document.getElementById("qr-wifi-pass").value.trim();
        return `WIFI:T:WPA;S:${ssid};P:${pass};H:false;;`;
      case "text":
        return document.getElementById("qr-text-val").value;
      case "email":
        const to = document.getElementById("qr-email-to").value.trim();
        const subject = document.getElementById("qr-email-subject").value.trim();
        return `mailto:${to}?subject=${encodeURIComponent(subject)}`;
      default:
        return "";
    }
  }

  async run(toolEngine) {
    const payload = this.buildDataPayload();
    if (!payload) {
      this.showStatus("❌ Please enter a valid payload/URL.", true);
      return;
    }

    this.showProgress(true, "Generating QR Code patterns...");
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const container = document.getElementById("qrCanvasContainer");
      const placeholder = document.getElementById("qrPlaceholder");
      container.innerHTML = ""; // Clear old canvas

      // Temporary render container for qrcode.js
      const tempDiv = document.createElement("div");
      
      const colorFore = document.getElementById("qrColorFore").value;
      const colorBack = document.getElementById("qrColorBack").value;
      const dotStyle = document.getElementById("qrDotStyle").value;

      // Generate base QR
      const qrGen = new window.QRCode(tempDiv, {
        text: payload,
        width: 300,
        height: 300,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.H // Max correction for logos
      });

      // Wait a frame for qrcode.js drawing
      setTimeout(async () => {
        const srcCanvas = tempDiv.querySelector("canvas");
        if (!srcCanvas) {
          this.showStatus("❌ Library failed to construct matrix.", true);
          this.showProgress(false);
          return;
        }

        // Apply dot shape styles
        const styledCanvas = this.applyDotStyle(srcCanvas, colorFore, colorBack, dotStyle);
        
        // Apply logo overlay if selected
        if (this.logoDataUrl) {
          await this.applyLogoOverlay(styledCanvas, this.logoDataUrl);
        }

        this.finalCanvas = styledCanvas;

        // Render in UI
        container.appendChild(styledCanvas);
        container.style.display = "block";
        placeholder.style.display = "none";

        // Verification Scan Test
        this.runVerificationScan(styledCanvas);

        this.showProgress(false);
        this.showStatus("✅ QR Code generated successfully!");
      }, 50);

    } catch (err) {
      console.error(err);
      this.showStatus(`❌ Generation error: ${err.message}`, true);
      this.showProgress(false);
    }
  }

  applyDotStyle(srcCanvas, colorFore, colorBack, dotStyle) {
    const size = srcCanvas.width;
    const ctx = srcCanvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    // Detect module size
    let moduleSize = 0;
    for (let x = 0; x < size; x++) {
      const idx = x * 4;
      if (data[idx] < 128) {
        let ex = x;
        while (ex < size && data[ex * 4] < 128) ex++;
        moduleSize = ex - x;
        break;
      }
    }
    if (moduleSize < 1) moduleSize = Math.max(1, Math.round(size / 25));

    const out = document.createElement("canvas");
    out.width = size;
    out.height = size;
    const oc = out.getContext("2d");

    oc.fillStyle = colorBack;
    oc.fillRect(0, 0, size, size);
    oc.fillStyle = colorFore;

    const numModules = Math.round(size / moduleSize);

    for (let row = 0; row < numModules; row++) {
      for (let col = 0; col < numModules; col++) {
        const px = Math.round(col * moduleSize);
        const py = Math.round(row * moduleSize);
        const idx = (py * size + px) * 4;
        const isDark = data[idx] < 128;

        if (!isDark) continue;

        const x = col * moduleSize;
        const y = row * moduleSize;
        const s = moduleSize;
        const pad = Math.max(1, s * 0.08);

        switch (dotStyle) {
          case "square":
            oc.fillRect(x, y, s, s);
            break;
          case "rounded":
            const r = s * 0.35;
            oc.beginPath();
            oc.moveTo(x + pad + r, y + pad);
            oc.lineTo(x + s - pad - r, y + pad);
            oc.quadraticCurveTo(x + s - pad, y + pad, x + s - pad, y + pad + r);
            oc.lineTo(x + s - pad, y + s - pad - r);
            oc.quadraticCurveTo(x + s - pad, y + s - pad, x + s - pad - r, y + s - pad);
            oc.lineTo(x + pad + r, y + s - pad);
            oc.quadraticCurveTo(x + pad, y + s - pad, x + pad, y + s - pad - r);
            oc.lineTo(x + pad, y + pad + r);
            oc.quadraticCurveTo(x + pad, y + pad, x + pad + r, y + pad);
            oc.closePath();
            oc.fill();
            break;
          case "circle":
            const r2 = s / 2;
            oc.beginPath();
            oc.arc(x + r2, y + r2, r2 - pad, 0, 2 * Math.PI);
            oc.fill();
            break;
        }
      }
    }
    return out;
  }

  async applyLogoOverlay(canvas, logoUrl) {
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const logoSize = Math.round(size * 0.22); // logo covers 22% center size
    
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;
        
        // Draw white card background cutout for logo
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        const r = Math.round(logoSize * 0.15); // rounded cutout
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + logoSize - r, y);
        ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + r);
        ctx.lineTo(x + logoSize, y + logoSize - r);
        ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - r, y + logoSize);
        ctx.lineTo(x + r, y + logoSize);
        ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        // Render logo image
        ctx.drawImage(img, x + 4, y + 4, logoSize - 8, logoSize - 8);
        resolve();
      };
      img.src = logoUrl;
    });
  }

  runVerificationScan(canvas) {
    if (!window.jsQR) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const imgData = ctx.getImageData(0, 0, size, size);
    
    const code = window.jsQR(imgData.data, size, size);
    const notification = this.engine.core.getEngine("notification");
    if (code) {
      console.log("[QR scan verify] Decoded successfully:", code.data);
      if (notification) {
        notification.show("Scan verified successfully! Decodable QR.", "success");
      }
    } else {
      console.warn("[QR scan verify] Scanner could not decode matrix.");
      if (notification) {
        notification.show("Warning: Code might be too dense or low contrast to scan.", "warning");
      }
    }
  }

  // Override output copy/download handlers
  getOutput() {
    if (this.finalCanvas) {
      return this.finalCanvas.toDataURL("image/png");
    }
    return "";
  }
}
