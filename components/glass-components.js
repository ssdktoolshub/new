// SSDK Component Library - Reusable Glassmorphic UI Components with Accessibility & Validation
// Built for professional, responsive configurations supporting 1000+ tools.

export class GlassComponents {
  
  /**
   * Generates a glassmorphic textarea wrapper.
   */
  static createTextarea(id, placeholder = "Enter input...", label = "", rows = 6, required = false, validator = null) {
    const wrap = document.createElement("div");
    wrap.className = "field-grid-1";
    
    const uniqueErrorId = `${id}-error`;

    if (label) {
      const lbl = document.createElement("label");
      lbl.className = "field-label";
      lbl.htmlFor = id;
      lbl.innerHTML = `${label}${required ? ' <span class="required-star" aria-hidden="true">*</span>' : ''}`;
      wrap.appendChild(lbl);
    }
    
    const textarea = document.createElement("textarea");
    textarea.id = id;
    textarea.className = "field-input";
    textarea.style.minHeight = "150px";
    textarea.placeholder = placeholder;
    textarea.rows = rows;
    textarea.required = required;
    textarea.setAttribute("aria-label", label || placeholder);
    textarea.setAttribute("aria-invalid", "false");
    textarea.setAttribute("aria-describedby", uniqueErrorId);
    
    const errorEl = document.createElement("span");
    errorEl.id = uniqueErrorId;
    errorEl.className = "field-error-msg";
    errorEl.style.display = "none";
    errorEl.style.color = "#ff6b6b";
    errorEl.style.fontSize = "0.75rem";
    errorEl.style.marginTop = "4px";
    errorEl.setAttribute("aria-live", "polite");

    if (validator) {
      textarea.addEventListener("input", () => {
        const val = textarea.value;
        const err = validator(val);
        if (err) {
          textarea.setAttribute("aria-invalid", "true");
          errorEl.textContent = err;
          errorEl.style.display = "block";
        } else {
          textarea.setAttribute("aria-invalid", "false");
          errorEl.style.display = "none";
        }
      });
    }

    wrap.appendChild(textarea);
    wrap.appendChild(errorEl);
    return wrap;
  }

  /**
   * Generates a standard glassmorphic input text field.
   */
  static createInput(id, type = "text", placeholder = "", label = "", defaultValue = "", required = false, validator = null) {
    const wrap = document.createElement("div");
    wrap.className = "field-grid-1";
    
    const uniqueErrorId = `${id}-error`;

    if (label) {
      const lbl = document.createElement("label");
      lbl.className = "field-label";
      lbl.htmlFor = id;
      lbl.innerHTML = `${label}${required ? ' <span class="required-star" aria-hidden="true">*</span>' : ''}`;
      wrap.appendChild(lbl);
    }
    
    const input = document.createElement("input");
    input.id = id;
    input.type = type;
    input.className = "field-input";
    input.placeholder = placeholder;
    input.value = defaultValue;
    input.required = required;
    input.setAttribute("aria-label", label || placeholder);
    input.setAttribute("aria-invalid", "false");
    input.setAttribute("aria-describedby", uniqueErrorId);
    
    const errorEl = document.createElement("span");
    errorEl.id = uniqueErrorId;
    errorEl.className = "field-error-msg";
    errorEl.style.display = "none";
    errorEl.style.color = "#ff6b6b";
    errorEl.style.fontSize = "0.75rem";
    errorEl.style.marginTop = "4px";
    errorEl.setAttribute("aria-live", "polite");

    if (validator) {
      input.addEventListener("input", () => {
        const val = input.value;
        const err = validator(val);
        if (err) {
          input.setAttribute("aria-invalid", "true");
          errorEl.textContent = err;
          errorEl.style.display = "block";
        } else {
          input.setAttribute("aria-invalid", "false");
          errorEl.style.display = "none";
        }
      });
    }

    wrap.appendChild(input);
    wrap.appendChild(errorEl);
    return wrap;
  }

  /**
   * Generates a dropdown select field.
   */
  static createSelect(id, options = [], label = "", defaultValue = "") {
    const wrap = document.createElement("div");
    wrap.className = "field-grid-1";
    
    if (label) {
      const lbl = document.createElement("label");
      lbl.className = "field-label";
      lbl.htmlFor = id;
      lbl.textContent = label;
      wrap.appendChild(lbl);
    }
    
    const select = document.createElement("select");
    select.id = id;
    select.className = "field-input select-input";
    select.setAttribute("aria-label", label);
    
    options.forEach(opt => {
      const option = document.createElement("option");
      option.value = typeof opt === "string" ? opt : opt.value;
      option.textContent = typeof opt === "string" ? opt : opt.text;
      if (option.value === defaultValue) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    wrap.appendChild(select);
    return wrap;
  }

  /**
   * Generates an interactive slider with dynamic values.
   */
  static createSlider(id, min = 0, max = 100, step = 1, defaultValue = 50, label = "") {
    const wrap = document.createElement("div");
    wrap.className = "field-grid-1 slider-wrap";
    
    const labelRow = document.createElement("div");
    labelRow.style.display = "flex";
    labelRow.style.justifyContent = "space-between";
    labelRow.style.alignItems = "center";
    labelRow.style.marginBottom = "4px";
    
    if (label) {
      const lbl = document.createElement("label");
      lbl.className = "field-label";
      lbl.htmlFor = id;
      lbl.textContent = label;
      labelRow.appendChild(lbl);
    }
    
    const valBadge = document.createElement("span");
    valBadge.className = "slider-value-badge";
    valBadge.id = `${id}-val-badge`;
    valBadge.textContent = defaultValue;
    labelRow.appendChild(valBadge);
    
    wrap.appendChild(labelRow);
    
    const slider = document.createElement("input");
    slider.id = id;
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = defaultValue;
    slider.className = "slider-input";
    slider.setAttribute("aria-valuemin", min);
    slider.setAttribute("aria-valuemax", max);
    slider.setAttribute("aria-valuenow", defaultValue);
    
    slider.addEventListener("input", (e) => {
      valBadge.textContent = e.target.value;
      slider.setAttribute("aria-valuenow", e.target.value);
    });
    
    wrap.appendChild(slider);
    return wrap;
  }

  /**
   * Generates a togglable switch checkbox.
   */
  static createSwitch(id, label = "", checked = false) {
    const wrap = document.createElement("div");
    wrap.className = "switch-container";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "10px";
    wrap.style.margin = "8px 0";
    
    const input = document.createElement("input");
    input.id = id;
    input.type = "checkbox";
    input.checked = checked;
    input.className = "switch-input";
    input.style.display = "none";
    
    const switchLabel = document.createElement("label");
    switchLabel.htmlFor = id;
    switchLabel.className = "switch-slider-label";
    switchLabel.setAttribute("tabindex", "0");
    switchLabel.setAttribute("role", "switch");
    switchLabel.setAttribute("aria-checked", checked ? "true" : "false");
    switchLabel.setAttribute("aria-label", label);

    const toggleState = () => {
      input.checked = !input.checked;
      switchLabel.setAttribute("aria-checked", input.checked ? "true" : "false");
      input.dispatchEvent(new Event("change"));
    };

    switchLabel.addEventListener("click", (e) => {
      e.preventDefault();
      toggleState();
    });

    switchLabel.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleState();
      }
    });
    
    const textLabel = document.createElement("span");
    textLabel.className = "field-label";
    textLabel.style.margin = "0";
    textLabel.textContent = label;
    
    wrap.appendChild(input);
    wrap.appendChild(switchLabel);
    wrap.appendChild(textLabel);
    return wrap;
  }

  /**
   * Generates a Drag & Drop Upload Zone area.
   */
  static createUploadZone(id, fileTypes = "*", label = "Drag & drop files or click to upload") {
    const zone = document.createElement("div");
    zone.id = id;
    zone.className = "upload-drop-zone";
    zone.setAttribute("tabindex", "0");
    zone.setAttribute("role", "button");
    zone.setAttribute("aria-label", label);
    
    const text = document.createElement("p");
    text.className = "upload-zone-text";
    text.textContent = label;
    
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = `${id}-file-input`;
    fileInput.accept = fileTypes;
    fileInput.style.display = "none";
    
    zone.appendChild(text);
    zone.appendChild(fileInput);
    
    // Drag/Drop visual feedbacks
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("dragover");
    });
    
    zone.addEventListener("dragleave", () => {
      zone.classList.remove("dragover");
    });
    
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        // Dispatch custom change event to trigger logic listeners
        fileInput.dispatchEvent(new Event("change"));
        text.textContent = `Selected: ${e.dataTransfer.files[0].name}`;
      }
    });
    
    zone.addEventListener("click", () => {
      fileInput.click();
    });

    zone.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        fileInput.click();
      }
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) {
        text.textContent = `Selected: ${fileInput.files[0].name}`;
      }
    });
    
    return zone;
  }
}
