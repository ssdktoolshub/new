// SSDK Python Engine - Manages communication with Python FastAPI backend services & WASM Pyodide client execution
// Centralizes client-side offline Python runs and remote server jobs proxies.

export class PythonEngine {
  constructor() {
    this.core = null;
    this.apiBaseUrl = "https://api.ssdktoolshub.com"; // Target backend API
    this.pyodideInstance = null;
    this.isLoadingWasm = false;
  }

  async init(core) {
    this.core = core;
  }

  /**
   * Initializes Pyodide WebAssembly client runtime environment.
   */
  async initPyodideWasm(onStatusUpdate = null) {
    if (this.pyodideInstance) return this.pyodideInstance;
    if (this.isLoadingWasm) {
      // Wait until loading finishes
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (this.pyodideInstance) {
            clearInterval(check);
            resolve(this.pyodideInstance);
          }
        }, 100);
      });
    }

    this.isLoadingWasm = true;
    if (onStatusUpdate) onStatusUpdate("Injecting WebAssembly Python engine binaries...");

    return new Promise((resolve, reject) => {
      // Check if pyodide script tag is already registered
      if (window.loadPyodide) {
        this.runPyodideBoot(onStatusUpdate).then(resolve).catch(reject);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
      script.onload = async () => {
        try {
          const instance = await this.runPyodideBoot(onStatusUpdate);
          resolve(instance);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = (e) => {
        this.isLoadingWasm = false;
        reject(new Error("Could not download WebAssembly Python engine CDN."));
      };
      document.head.appendChild(script);
    });
  }

  async runPyodideBoot(onStatusUpdate) {
    if (onStatusUpdate) onStatusUpdate("Starting Python WASM interpreter...");
    this.pyodideInstance = await window.loadPyodide();
    
    // Setup stdout / stderr capturing redirection buffers
    await this.pyodideInstance.runPythonAsync(`
      import sys
      import io
      sys.stdout = io.StringIO()
      sys.stderr = io.StringIO()
    `);

    this.isLoadingWasm = false;
    if (onStatusUpdate) onStatusUpdate("✅ Python engine initialized successfully.");
    return this.pyodideInstance;
  }

  /**
   * Executes a Python script client-side in the browser WASM sandbox.
   */
  async runOfflinePython(code, inputVariables = {}) {
    const py = await this.initPyodideWasm();
    
    // Clear stdout/stderr buffers before execution
    await py.runPythonAsync(`
      sys.stdout.seek(0)
      sys.stdout.truncate(0)
      sys.stderr.seek(0)
      sys.stderr.truncate(0)
    `);

    // Inject variable bridges
    Object.keys(inputVariables).forEach(key => {
      py.globals.set(key, inputVariables[key]);
    });

    // Execute script
    const result = await py.runPythonAsync(code);

    // Retrieve stdout/stderr streams
    const stdout = py.runPython(`sys.stdout.getvalue()`);
    const stderr = py.runPython(`sys.stderr.getvalue()`);

    return {
      result,
      stdout,
      stderr
    };
  }

  /**
   * Executes a backend endpoint task with JSON payload.
   */
  async runBackendTask(endpoint, payload = {}) {
    const notification = this.core.getEngine("notification");
    
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API returned error status: ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      console.error("[PythonEngine] API request failed:", e);
      if (notification) {
        notification.show(`API connection error: ${e.message}`, "error");
      }
      throw e;
    }
  }

  /**
   * Uploads multiple files to a backend stream and tracks upload progress.
   */
  async uploadFilesTask(endpoint, filesList, onProgress = null) {
    const formData = new FormData();
    filesList.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${this.apiBaseUrl}${endpoint}`, true);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Server error: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("API network execution failure"));
      xhr.send(formData);
    });
  }
}
