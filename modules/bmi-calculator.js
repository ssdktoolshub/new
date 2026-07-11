// SSDK Native Medical Plugin - BMI Calculator
// Plugs into ToolEngine, delegates heavy clinical processing to FastAPI.

export async function init(toolData, core) {
  console.log(`[Plugin: Medical] Booting ${toolData.name}...`);
  
  const container = document.getElementById("tool-workspace");
  if (!container) return;

  // Render UI
  container.innerHTML = `
    <div class="content-card">
      <div class="input-group">
        <label>Weight (kg)</label>
        <input type="number" id="bmiWeight" placeholder="e.g. 70" class="ssdk-input">
      </div>
      <div class="input-group" style="margin-top:15px">
        <label>Height (cm)</label>
        <input type="number" id="bmiHeight" placeholder="e.g. 175" class="ssdk-input">
      </div>
      <button id="bmiAction" class="btn" style="margin-top:20px; width:100%;">Calculate BMI</button>
      
      <div id="bmiResult" class="result-box" style="display:none; margin-top:20px; text-align:center;">
        <h2 id="bmiValue" style="color:var(--accent);">--</h2>
        <p id="bmiCategory" class="muted">--</p>
        <div class="alert-warning" id="bmiDisclaimer" style="margin-top:15px; font-size:0.8rem;"></div>
      </div>
    </div>
  `;

  // Bind Actions
  const btn = document.getElementById("bmiAction");
  btn.addEventListener("click", async () => {
    btn.textContent = "Processing securely...";
    
    const weight = document.getElementById("bmiWeight").value;
    const height = document.getElementById("bmiHeight").value;
    
    // Delegate to FastAPI Backend
    const config = core.getEngine("config");
    const errorEngine = core.getEngine("error");
    
    try {
      const apiUrl = `${config.getApiUrl("medical")}/calculate`;
      
      const payload = {
        calculator_id: "bmi-calculator",
        variables: { weight, height }
      };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Backend Medical API Failed");
      const data = await res.json();
      
      // Update UI
      const resBox = document.getElementById("bmiResult");
      resBox.style.display = "block";
      document.getElementById("bmiValue").textContent = data.results.bmi;
      document.getElementById("bmiCategory").textContent = data.results.category;
      document.getElementById("bmiDisclaimer").innerHTML = `⚠️ <strong>Medical Disclaimer:</strong> ${data.disclaimer}`;
      
    } catch (e) {
      if(errorEngine) errorEngine.log("error", "BMI Plugin", "Calculation failed.", e);
      alert("Error reaching clinical backend.");
    } finally {
      btn.textContent = "Calculate BMI";
    }
  });
}
