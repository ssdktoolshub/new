// SSDK Native AI Plugin - Assistant Interface
// Plugs into ToolEngine, delegates heavy AI/LLM processing to FastAPI background tasks.

export async function init(toolData, core) {
  console.log(`[Plugin: AI] Booting ${toolData.name}...`);
  
  const container = document.getElementById("tool-workspace");
  if (!container) return;

  // Render UI
  container.innerHTML = `
    <div class="content-card">
      <div class="input-group">
        <label>System Prompt (Optional)</label>
        <input type="text" id="aiSystem" placeholder="e.g. Translate to Bengali" class="ssdk-input">
      </div>
      <div class="input-group" style="margin-top:15px">
        <label>Input Text</label>
        <textarea id="aiInput" placeholder="Enter text to process..." class="ssdk-input" rows="4"></textarea>
      </div>
      <button id="aiAction" class="btn" style="margin-top:20px; width:100%;">Process with AI</button>
      
      <div id="aiResult" class="result-box" style="display:none; margin-top:20px;">
        <h3 style="color:var(--accent); margin-bottom:10px;">AI Response:</h3>
        <p id="aiOutput" style="white-space: pre-wrap;"></p>
      </div>
    </div>
  `;

  // Bind Actions
  const btn = document.getElementById("aiAction");
  btn.addEventListener("click", async () => {
    btn.textContent = "AI is thinking...";
    btn.disabled = true;
    
    const text = document.getElementById("aiInput").value;
    const system = document.getElementById("aiSystem").value;
    
    const config = core.getEngine("config");
    const errorEngine = core.getEngine("error");
    
    try {
      // Step 1: Trigger background task
      const triggerUrl = `${config.getApiUrl("ai")}/process/generic`;
      const res = await fetch(triggerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, system })
      });
      
      if (!res.ok) throw new Error("Backend AI API Failed");
      const data = await res.json();
      const taskId = data.task_id;
      
      // Step 2: Poll for completion (Mock implementation for now)
      setTimeout(async () => {
        const statusUrl = `${config.getApiUrl("ai")}/status/${taskId}`;
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();
        
        // Update UI
        const resBox = document.getElementById("aiResult");
        resBox.style.display = "block";
        document.getElementById("aiOutput").textContent = statusData.result || "Generation complete.";
        
        btn.textContent = "Process with AI";
        btn.disabled = false;
      }, 2500);
      
    } catch (e) {
      if(errorEngine) errorEngine.log("error", "AI Plugin", "Generation failed.", e);
      alert("Error reaching AI backend.");
      btn.textContent = "Process with AI";
      btn.disabled = false;
    }
  });
}
