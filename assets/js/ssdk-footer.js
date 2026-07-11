// Calculate directory depth dynamically
const isSub = window.location.pathname.includes("/pages/") || window.location.pathname.includes("/tools/") || window.location.pathname.includes("/categories/");
const prefix = isSub ? ".." : ".";

// Footer HTML injection
document.body.insertAdjacentHTML("beforeend", `
<footer>
  <div class="foot-grid">

    <div>
      <h4><span class="brand-ssdk">SSDK</span> <span class="brand-th">Tools Hub</span></h4>
      <p>Smart Tools for Smart Creators By SWARNAVA DAS</p>
      <div class="socials">
        <a href="#" title="Facebook">📘</a>
        <a href="#" title="Instagram">📷</a>
        <a href="#" title="Twitter">🐦</a>
        <a href="#" title="YouTube">▶️</a>
      </div>
    </div>

    <div>
      <h4>Quick Links</h4>
      <a href="${prefix}/index.html">Home</a>
      <a href="${prefix}/pages/about.html">About Developer</a>
      <a href="${prefix}/pages/contact.html">Contact Us</a>
    </div>

    <div>
      <h4>Legal Policies</h4>
      <a href="${prefix}/pages/privacy.html">Privacy Policy</a>
      <a href="${prefix}/pages/disclaimer.html">Disclaimer</a>
      <a href="${prefix}/pages/terms.html">Terms & Conditions</a>
    </div>

    <div>
      <h4>Hosting & Tech</h4>
      <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 8px;">Built with HTML, CSS, JS, PHP, Python, and Firebase.</p>
      <p style="font-size: 0.85rem; color: var(--muted);">Compatible with free Vercel, Netlify, and Render deployments.</p>
    </div>

  </div>

  <div class="copy">
    © 2026 <span class="brand-ssdk">SSDK</span> <span class="brand-th">Tools Hub</span> &bull; Designed to inspire. Built to create.
  </div>
</footer>

<!-- Floating AI Assistant Widget -->
<div class="ai-widget-bubble" id="aiBubble" title="Ask AI Assistant">🤖</div>
<div class="ai-widget-container" id="aiContainer">
  <div class="ai-header">
    <div class="ai-header-left">
      <div class="ai-header-status"></div>
      <div class="ai-header-title">SSDK AI Assistant</div>
    </div>
    <button class="ai-close-btn" id="aiClose">✕</button>
  </div>
  <div class="ai-chat-body" id="aiChatBody">
    <div class="ai-message bot">Hello! I am your SSDK AI Assistant. How can I help you today? You can ask me to find tools, explain how they work, or suggest related tools!</div>
    <div class="ai-suggested-actions">
      <button class="ai-suggested-btn" onclick="sendSuggestedMessage('Find BMI Calculator')">Find BMI Calculator</button>
      <button class="ai-suggested-btn" onclick="sendSuggestedMessage('Image Compressor')">Image Compressor</button>
      <button class="ai-suggested-btn" onclick="sendSuggestedMessage('Show all categories')">Show all categories</button>
    </div>
  </div>
  <div class="ai-chat-input-row">
    <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ask me anything...">
    <button class="ai-send-btn" id="aiSend">➔</button>
  </div>
</div>
`);

// --- Standalone chatbot logic ---
let chatbotTools = [];
let chatbotCategories = [];

async function initChatbotData() {
  if (chatbotTools.length > 0) return;
  try {
    const [tRes, cRes] = await Promise.all([
      fetch(`${prefix}/assets/json/tools.json`).then(r => r.json()),
      fetch(`${prefix}/assets/json/categories.json`).then(r => r.json())
    ]);
    chatbotTools = tRes;
    chatbotCategories = cRes;
  } catch (e) {
    console.error("Failed loading chatbot data", e);
  }
}

function processChatbotMessage(msg) {
  const q = msg.trim().toLowerCase();
  
  if (q.includes("hello") || q.includes("hi ") || q.includes("hey") || q.includes("help")) {
    return {
      reply: "Hello! I am your SSDK AI Assistant. How can I help you today? You can ask me to find tools, explain how they work, or suggest related tools!",
      suggestions: ["Find BMI Calculator", "Image Compressor", "Show all categories"]
    };
  }

  if (q.includes("categories") || q.includes("category") || q.includes("show all categories")) {
    const list = chatbotCategories.map(c => `• ${c.emoji} ${c.name}`).join("<br>");
    return {
      reply: `Here are our main tool categories:<br><br>${list}<br><br>Tell me what you'd like to do, and I'll find the right tool!`,
      suggestions: ["Developer Tools", "SEO Tools", "AI Tools"]
    };
  }

  // Check explanation requests
  if (q.includes("how to use") || q.includes("explain") || q.includes("what is") || q.includes("about")) {
    const targetTool = chatbotTools.find(t => q.includes(t.name.toLowerCase()) || q.includes(t.id.toLowerCase()));
    if (targetTool) {
      return {
        reply: `<strong>${targetTool.name}</strong> is in our <strong>${targetTool.category}</strong> category.<br><br><strong>Description:</strong> ${targetTool.description}<br><br>You can open and run this tool directly here: <a href="${prefix}/${targetTool.url}" target="_blank" style="color:var(--accent);font-weight:700;text-decoration:underline;">${targetTool.icon} Open ${targetTool.name}</a>.`,
        suggestions: [`Related to ${targetTool.name}`, "Show all categories"]
      };
    }
  }

  // Try to search for matching tools
  const matches = chatbotTools.filter(t => {
    return t.name.toLowerCase().includes(q) || 
           t.description.toLowerCase().includes(q) || 
           (t.subcategory && t.subcategory.toLowerCase().includes(q)) ||
           (t.keywords && t.keywords.some(kw => kw.toLowerCase().includes(q))) ||
           (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)));
  });

  if (matches.length > 0) {
    const topMatches = matches.slice(0, 3);
    const links = topMatches.map(t => {
      return `<a href="${prefix}/${t.url}" target="_blank" style="color:var(--accent);font-weight:700;text-decoration:underline;">${t.icon} ${t.name}</a> - ${t.description}`;
    }).join("<br><br>");

    return {
      reply: `I found some tools that match your request:<br><br>${links}`,
      suggestions: [`How to use ${topMatches[0].name}?`, "Show all categories"]
    };
  }

  // Fallback response
  return {
    reply: "I couldn't find a specific tool matching that request. Could you try rephrasing? For example, ask for 'compress image', 'BMI', or 'hex to rgb'.",
    suggestions: ["Show all categories", "Find BMI Calculator"]
  };
}

// Attach UI Event Listeners
const bubble = document.getElementById("aiBubble");
const container = document.getElementById("aiContainer");
const closeBtn = document.getElementById("aiClose");
const chatBody = document.getElementById("aiChatBody");
const chatInput = document.getElementById("aiChatInput");
const sendBtn = document.getElementById("aiSend");

if (bubble && container && closeBtn) {
  bubble.onclick = async () => {
    const isActive = container.classList.toggle("active");
    if (isActive) {
      await initChatbotData();
      chatInput.focus();
    }
  };
  
  closeBtn.onclick = () => {
    container.classList.remove("active");
  };
}

function appendMessage(text, isUser = false) {
  const msgEl = document.createElement("div");
  msgEl.className = `ai-message ${isUser ? 'user' : 'bot'}`;
  msgEl.innerHTML = text;
  chatBody.appendChild(msgEl);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;
  
  appendMessage(text, true);
  chatInput.value = "";
  
  // Remove existing suggested action buttons
  const oldSuggest = chatBody.querySelector(".ai-suggested-actions");
  if (oldSuggest) oldSuggest.remove();
  
  setTimeout(() => {
    const result = processChatbotMessage(text);
    appendMessage(result.reply, false);
    
    if (result.suggestions && result.suggestions.length > 0) {
      const suggestRow = document.createElement("div");
      suggestRow.className = "ai-suggested-actions";
      result.suggestions.forEach(s => {
        const btn = document.createElement("button");
        btn.className = "ai-suggested-btn";
        btn.textContent = s;
        btn.onclick = () => sendSuggestedMessage(s);
        suggestRow.appendChild(btn);
      });
      chatBody.appendChild(suggestRow);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }, 400);
}

if (sendBtn && chatInput) {
  sendBtn.onclick = handleSend;
  chatInput.onkeydown = (e) => {
    if (e.key === "Enter") handleSend();
  };
}

window.sendSuggestedMessage = (msg) => {
  chatInput.value = msg;
  handleSend();
};

// --- Dynamic Related Tools section on tool pages ---
if (isSub && window.location.pathname.includes("/tools/")) {
  const toolId = window.location.pathname.split("/").pop().replace(".html", "");
  
  fetch(`${prefix}/assets/json/tools.json`)
    .then(r => r.json())
    .then(tools => {
      const tool = tools.find(t => t.id === toolId || t.url.endsWith(`${toolId}.html`));
      if (tool) {
        const related = tools.filter(t => t.category === tool.category && t.id !== tool.id).slice(0, 4);
        if (related.length > 0) {
          const section = document.createElement("section");
          section.className = "content-card related-tools-section reveal-on-scroll";
          section.style.margin = "40px auto";
          section.style.maxWidth = "1200px";
          section.style.padding = "20px 6%";
          
          section.innerHTML = `
            <h3 style="margin-bottom: 16px; font-weight: 800; font-size: 1.3rem;">📋 Related Tools (${tool.subcategory || 'General'})</h3>
            <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;">
              ${related.map(r => `
                <a class="card show" href="${prefix}/${r.url}" target="_blank" style="text-decoration:none; color:var(--text); background: var(--bg2); border: 1px solid var(--border); padding: 16px; border-radius: 12px; display: block; transition: all 0.3s;">
                  <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                    <span class="icon" style="font-size:1.3rem;">${r.icon}</span>
                    <h3 style="font-size:1rem; font-weight:700;">${r.name}</h3>
                  </div>
                  <p style="font-size:0.8rem; color:var(--muted);">${r.description}</p>
                </a>
              `).join("")}
            </div>
          `;
          
          const footer = document.querySelector("footer");
          if (footer) {
            footer.parentNode.insertBefore(section, footer);
          }
        }
      }
    }).catch(e => console.error("Failed loading related tools", e));
}