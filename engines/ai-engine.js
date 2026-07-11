// SSDK AI Engine - Coordinates Natural Language Processing and Generation API actions
// Combines server-side generative API proxies with offline NLP extraction fallbacks.

export class AIEngine {
  constructor() {
    this.core = null;
  }

  async init(core) {
    this.core = core;
  }

  /**
   * Generates text summary using extractive frequency-based scoring (client fallback)
   * or routes to LLM backend if online.
   */
  async summarize(text, options = {}) {
    const pythonEngine = this.core.getEngine("python");
    const analytics = this.core.getEngine("analytics");
    
    if (analytics) {
      analytics.logEvent("ai", "summarize", `length: ${text.length}`);
    }
    
    // Check if offline/local-fallback is preferred or if server is unavailable
    if (options.localOnly || window.location.protocol === "file:") {
      return this.localExtractiveSummarizer(text, options.sentences || 3);
    }
    
    // Call server AI endpoint
    try {
      const response = await pythonEngine.runBackendTask("/v1/ai/summarize", {
        text,
        ratio: options.ratio || 0.3,
        extract_entities: options.extractEntities || false
      });
      return response.summary;
    } catch (e) {
      console.warn("[AIEngine] Backend AI failed. Running client-side fallback summary.", e);
      return this.localExtractiveSummarizer(text, options.sentences || 3);
    }
  }

  /**
   * Generates template copywriting texts.
   */
  async generateText(prompt, tone = "professional", type = "blog-intro") {
    const pythonEngine = this.core.getEngine("python");
    const analytics = this.core.getEngine("analytics");
    
    if (analytics) {
      analytics.logEvent("ai", "generate", `type: ${type}`);
    }
    
    try {
      const response = await pythonEngine.runBackendTask("/v1/ai/generate", {
        prompt,
        tone,
        type
      });
      return response.text;
    } catch (e) {
      console.warn("[AIEngine] Backend text generation failed. Running local template compiler.", e);
      return this.localTemplateWriter(prompt, tone, type);
    }
  }

  /**
   * Client-side NLP extractive summarization.
   */
  localExtractiveSummarizer(text, numSentences = 3) {
    if (!text || !text.trim()) return "";
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length <= numSentences) return text;

    // Build word frequency map
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const stopWords = new Set(["the", "and", "a", "of", "to", "is", "in", "it", "that", "this", "for", "on", "with", "as", "at", "by", "an", "be", "was", "are", "or"]);
    
    const freqs = {};
    words.forEach(w => {
      if (!stopWords.has(w)) {
        freqs[w] = (freqs[w] || 0) + 1;
      }
    });

    // Score sentences based on word frequencies
    const scored = sentences.map(s => {
      const sWords = s.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      let score = 0;
      sWords.forEach(w => {
        score += freqs[w] || 0;
      });
      return { sentence: s, score };
    });

    // Sort and grab top sentences in original chronological order
    const topScored = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, numSentences);

    return sentences
      .filter(s => topScored.some(t => t.sentence === s))
      .join(" ")
      .trim();
  }

  localTemplateWriter(prompt, tone, type) {
    // Basic local rule-based generation templates
    return `[SSDK AI Local fallback writer]
Tone: ${tone}
Type: ${type}
Based on: "${prompt}"

This is a premium, rule-based text compiler generated locally inside your web browser. When SSDK Tools Hub is connected to its FastAPI server, this section automatically links to LLM generative APIs for custom articles, blog posts, and copy writing.`;
  }

  /**
   * AI Chatbot helper for floating assistant widget
   */
  async chat(message) {
    const q = message.trim().toLowerCase();
    const searchEngine = this.core.getEngine("search");
    const configEngine = this.core.getEngine("config");
    
    // Help commands
    if (q.includes("hello") || q.includes("hi ") || q.includes("hey") || q.includes("help")) {
      return {
        reply: "Hello! I am your SSDK AI Assistant. How can I help you today? You can ask me to find tools, explain how they work, or suggest related tools!",
        suggestions: ["Find BMI Calculator", "Image Compressor", "Show all categories"]
      };
    }

    if (q.includes("categories") || q.includes("category")) {
      const cats = await configEngine.getCategories();
      const list = cats.map(c => `• ${c.emoji} ${c.name}`).join("<br>");
      return {
        reply: `Here are our main tool categories:<br><br>${list}<br><br>Tell me what you'd like to do, and I'll find the right tool!`,
        suggestions: ["Developer Tools", "SEO Tools", "AI Tools"]
      };
    }

    // Check explanation requests
    if (q.includes("how to use") || q.includes("explain") || q.includes("what is") || q.includes("about")) {
      const tools = await configEngine.getTools();
      const targetTool = tools.find(t => q.includes(t.name.toLowerCase()) || q.includes(t.id.toLowerCase()));
      if (targetTool) {
        return {
          reply: `<strong>${targetTool.name}</strong> is in our <strong>${targetTool.category}</strong> category.<br><br><strong>Description:</strong> ${targetTool.description}<br><br>You can open and run this tool directly here: <a href="${this.core.prefix}/${targetTool.url}" target="_blank" style="color:var(--accent);font-weight:700;text-decoration:underline;">${targetTool.icon} Open ${targetTool.name}</a>.`,
          suggestions: [`Related to ${targetTool.name}`, "Show all categories"]
        };
      }
    }

    // Try to search for matching tools
    const matches = await searchEngine.search(q);
    if (matches && matches.length > 0) {
      const topMatches = matches.slice(0, 3);
      const links = topMatches.map(t => {
        return `<a href="${this.core.prefix}/${t.url}" target="_blank" style="color:var(--accent);font-weight:700;text-decoration:underline;">${t.icon} ${t.name}</a> - ${t.description}`;
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
}
