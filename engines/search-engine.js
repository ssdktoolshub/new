// SSDK Search Engine - Indexes and fuzzy-matches tools dynamically
// Coordinates caching, score weightings, recent searches history and auto-suggestions.

export class SearchEngine {
  constructor() {
    this.core = null;
    this.historyKey = "ssdk-recent-searches";
  }

  async init(core) {
    this.core = core;
  }

  /**
   * Helper to resolve common synonym search mappings.
   */
  getSynonymTarget(query) {
    const q = query.trim().toLowerCase();
    const synonyms = {
      "photo": "image tools",
      "pic": "image tools",
      "pics": "image tools",
      "picture": "image tools",
      "pictures": "image tools",
      "document": "pdf tools",
      "docs": "pdf tools",
      "join pdf": "merge pdf",
      "combine pdf": "merge pdf",
      "remove bg": "background remover",
      "bg remover": "background remover",
      "passport": "passport photo maker",
      "compress image": "image compressor",
      "jpg to png": "image converter",
      "png to jpg": "image converter",
      "lab": "medical & laboratory tools",
      "medical": "medical & laboratory tools",
      "cbc": "cbc report analyzer",
      "ecg": "ecg helper"
    };
    return synonyms[q] || null;
  }

  /**
   * Calculates Levenshtein edit distance between two strings for typo correction.
   */
  getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[a.length][b.length];
  }

  /**
   * Search tool manifests against query parameters with weighted relevance scoring.
   */
  async search(query) {
    const q = query.trim().toLowerCase();
    const config = this.core.getEngine("config");
    const tools = await config.getTools();

    if (!q) return tools;

    const synonymTarget = this.getSynonymTarget(q);

    // Weighted Fuzzy rank scoring
    const results = tools.map(tool => {
      let score = 0;
      const name = (tool.name || "").toLowerCase();
      const desc = (tool.description || "").toLowerCase();
      const cat = (tool.category || "").toLowerCase();
      const sub = (tool.subcategory || "").toLowerCase();
      
      // 1. Exact Match (Highest Priority)
      if (name === q) {
        score += 1000;
      } 
      // 2. Starts With
      else if (name.startsWith(q)) {
        score += 800;
      } 
      // 3. Contains
      else if (name.includes(q)) {
        score += 600;
      }

      // 4. Keyword Match
      if (tool.keywords && Array.isArray(tool.keywords)) {
        tool.keywords.forEach(kw => {
          const cleanKw = kw.toLowerCase();
          if (cleanKw === q) score += 400;
          else if (cleanKw.includes(q)) score += 350;
        });
      }

      // 5. Alias Match
      if (tool.aliases && Array.isArray(tool.aliases)) {
        tool.aliases.forEach(alias => {
          const cleanAlias = alias.toLowerCase();
          if (cleanAlias === q) score += 300;
          else if (cleanAlias.includes(q)) score += 250;
        });
      }

      // 6. Tag Match
      if (tool.tags && Array.isArray(tool.tags)) {
        tool.tags.forEach(tag => {
          const cleanTag = tag.toLowerCase();
          if (cleanTag === q) score += 200;
          else if (cleanTag.includes(q)) score += 180;
        });
      }

      // 7. Synonym Match (from universal registry array or hardcoded map)
      if (tool.synonyms && Array.isArray(tool.synonyms)) {
        tool.synonyms.forEach(syn => {
          const cleanSyn = syn.toLowerCase();
          if (cleanSyn === q) score += 150;
          else if (cleanSyn.includes(q)) score += 130;
        });
      }
      if (synonymTarget) {
        if (name === synonymTarget || name.includes(synonymTarget)) score += 150;
        if (cat.includes(synonymTarget)) score += 140;
        if (sub.includes(synonymTarget)) score += 130;
      }

      // 8. Description Match
      if (desc.includes(q)) {
        score += 100;
      }

      // Bonus category / subcategory weighting
      if (cat.includes(q)) score += 90;
      if (sub.includes(q)) score += 80;

      // Add small boost for popular/featured tools to resolve ties
      if (tool.featured) {
        score += 5;
      }

      return { tool, score };
    });

    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.tool);
  }

  /**
   * Find typo suggestions when a search fails to return results.
   */
  async getTypoSuggestions(query) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    
    const config = this.core.getEngine("config");
    const tools = await config.getTools();
    
    const suggestions = [];
    tools.forEach(tool => {
      const name = (tool.name || "").toLowerCase();
      const dist = this.getLevenshteinDistance(q, name);
      // If the word length is short allow 1 edit, otherwise up to 3 edits
      const maxAllowed = q.length <= 4 ? 1 : 3;
      if (dist <= maxAllowed) {
        suggestions.push({ name: tool.name, dist });
      }
    });
    
    return suggestions
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map(s => s.name);
  }

  /**
   * Returns list of auto-suggestions based on initial letter inputs.
   */
  async getSuggestions(query) {
    if (!query || query.trim().length < 2) return [];
    const list = await this.search(query);
    return list.slice(0, 5).map(t => t.name);
  }

  getRecentSearches() {
    try {
      const stored = localStorage.getItem(this.historyKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("[SearchEngine] Failed to read recent searches", e);
      return [];
    }
  }

  addRecentSearch(query) {
    const clean = query.trim();
    if (!clean || clean.length < 2) return;

    let list = this.getRecentSearches();
    list = list.filter(q => q.toLowerCase() !== clean.toLowerCase());
    list.unshift(clean);

    if (list.length > 5) {
      list.pop();
    }
    localStorage.setItem(this.historyKey, JSON.stringify(list));
  }

  clearRecentSearches() {
    localStorage.removeItem(this.historyKey);
  }
}

