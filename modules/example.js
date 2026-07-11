// SSDK Example Tool Module - Reference implementation for Developers
// Demonstrates how to extend SSDKTool, retrieve inputs, and return outputs.

import { SSDKTool } from "../core/sdk.js";

export default class ExampleTool extends SSDKTool {
  constructor() {
    super();
  }

  /**
   * Run the custom tool logic.
   */
  async run(toolEngine) {
    this.showProgress(true, "Analysing input text...");
    
    // Simulate a brief asynchronous operation
    await new Promise(resolve => setTimeout(resolve, 800));

    // Get default input value
    const inputVal = this.getInputValue("toolInput");

    if (!inputVal) {
      this.showStatus("❌ Input text cannot be empty.", true);
      this.showProgress(false);
      return;
    }

    // Process output: word count and character details
    const wordCount = inputVal.split(/\s+/).filter(Boolean).length;
    const charCount = inputVal.length;
    const reversedText = inputVal.split("").reverse().join("");

    const outputText = `--- SSDK EXAMPLE TOOL RESULT ---
Input Characters: ${charCount}
Input Words: ${wordCount}

Reversed Text:
${reversedText}
`;

    // Set default output value
    this.setOutputValue(outputText, "toolOutput");

    this.showProgress(false);
    this.showStatus("✅ Analysis finished successfully!");
  }
}
