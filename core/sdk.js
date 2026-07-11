// SSDK Developer SDK - Base class blueprint for all SSDK Tool Modules

export class SSDKTool {
  constructor() {
    this.engine = null;
  }

  /**
   * Called automatically by the ToolEngine when mounting a tool.
   */
  async init(toolEngine) {
    this.engine = toolEngine;
  }

  /**
   * Called when the user clicks the central "Run" action button.
   * To be overridden by the tool module subclass.
   */
  async run(toolEngine) {
    throw new Error("[SSDK SDK] Method run() not implemented by the tool module subclass.");
  }

  // =========================================================================
  // UTILITY HELPER METHODS FOR RAPID DEVELOPMENT
  // =========================================================================

  /**
   * Returns the value of an input field.
   */
  getInputValue(id = "toolInput") {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  /**
   * Sets the value of an output field.
   */
  setOutputValue(value, id = "toolOutput") {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.value = value;
      } else {
        el.textContent = value;
      }
    }
  }

  showProgress(show, text = "Processing data...") {
    if (this.engine) this.engine.showProgress(show, text);
  }

  showStatus(text, isError = false) {
    if (this.engine) this.engine.showStatus(text, isError);
  }

  hideStatus() {
    if (this.engine) this.engine.hideStatus();
  }
}
