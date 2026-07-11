// SSDK Homepage Engine - Dynamically renders category blocks, tool grids, binds searches, and manages filters.
// Integrates metadata configurations from settings, featured, and popular databases.

export class HomepageEngine {
  constructor() {
    this.core = null;
    this.container = null;
    this.activeFilter = "all";
    this.selectedSuggestionIndex = -1;
  }

  async init(core) {
    this.core = core;
    
    // Bind after DOM renders
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.mount());
    } else {
      this.mount();
    }
  }

  async mount() {
    this.container = document.getElementById("toolContainer");
    if (!this.container) return; // Exit if not on landing index page

    // Dynamic hero text injection from homepage.json
    await this.applyHomepageMetadata();

    // 1. Inject Premium Search & Suggestions structure
    this.injectSearchUI();

    // 2. Inject Sticky Categories Bar
    await // 3. Inject Sorting & Filter Bar
    this.renderFilterBar();
    
    // 4. Initial Render
    await this.render();

    // 5. Bind Search events & Voice recognition
    this.bindSearch();
    this.initCategoryRedirectionScrolls();

    // Global Event Delegation for dynamic cards (O(1) memory)
    this.container.addEventListener("click", async (e) => {
      // Handle subcategory collapse toggle
      const subTitle = e.target.closest(".subcat-title");
      if (subTitle) {
        const block = subTitle.closest(".subcat-block");
        if (block) block.classList.toggle("collapsed");
        return;
      }
      
      // Handle favorite star toggle
      const favBtn = e.target.closest(".fav-btn");
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = favBtn.getAttribute("data-id");
        const config = this.core.getEngine("config");
        const favorites = this.core.getEngine("favorites");
        
        if (favorites && config) {
          const tools = await config.getTools();
          const targetTool = tools.find(x => x.id === id);
          if (targetTool) {
            await favorites.toggleFavorite(targetTool);
            favBtn.classList.toggle("on", favorites.isFavorite(id));
            if (window.updateFavoritesBadge) window.updateFavoritesBadge();
          }
        }
      }
    });

    // Listen to language change to re-translate homepage elements
    window.addEventListener("ssdk-lang-change", () => {
      this.render();
    });

    // Check if URL hash is #favorites on load
    if (window.location.hash === "#favorites") {
      const favBtn = document.getElementById("filterFavBtn");
      if (favBtn) favBtn.click();
    }
  }

  async applyHomepageMetadata() {
    const config = this.core.getEngine("config");
    const meta = await config.loadJSON("homepage.json");
    if (meta) {
      const heroTitle = document.querySelector(".hero h1.text-3d");
      const heroSub = document.querySelector(".hero p.subtitle");
      if (heroTitle && meta.heroTitle) {
        heroTitle.textContent = meta.heroTitle;
      }
      if (heroSub && meta.heroSub) {
        heroSub.textContent = meta.heroSub;
      }
    }
  }

  injectSearchUI() {
    const searchWrap = document.querySelector(".search-wrap");
    if (searchWrap) {
      searchWrap.innerHTML = `
        <div class="search-container">
          <input id="search" type="text" placeholder="🔍 Search 150+ tools... (e.g. PDF, QR, Medical, JSON)">
          <button class="voice-search-btn" id="voiceSearchBtn" title="Voice Search">🎤</button>
        </div>
        <div class="search-suggestions-panel" id="searchSuggestions">
          <div id="suggestionsSection" style="display:none">
            <div class="suggestion-group-title" data-translate="suggestTitle">Suggestions</div>
            <div class="suggestion-list" id="autocompleteSuggestions"></div>
          </div>
          <div class="suggestion-group-title" data-translate="popularTitle">Popular Searches</div>
          <div class="tags-container" id="popularSearches"></div>
          <div class="suggestion-group-title" data-translate="recentTitle">Recent Searches</div>
          <div class="tags-container" id="recentSearches"></div>
        </div>
      `;
    }
  }

  renderFilterBar() {
    const toolsSec = document.getElementById("tools");
    if (!toolsSec) return;

    if (document.getElementById("homepageFilterBar")) return;

    const filterBar = document.createElement("div");
    filterBar.className = "filter-bar";
    filterBar.id = "homepageFilterBar";

    filterBar.innerHTML = `
      <div class="filter-group">
        <span class="filter-label" data-translate="sortLabel">Sort:</span>
        <select class="filter-select" id="sortSelect">
          <option value="alphabetical">Alphabetical (A-Z)</option>
          <option value="reverse">Alphabetical (Z-A)</option>
          <option value="newest">Newest Tools</option>
          <option value="popular">Most Popular</option>
          <option value="trending">Trending Tools</option>
        </select>
      </div>

      <div class="filter-btn-group">
        <button class="filter-btn active" id="filterAllBtn" data-translate="filterAll">All Tools</button>
        <button class="filter-btn" id="filterFavBtn" data-translate="filterFav">⭐ Favorites</button>
        <button class="filter-btn" id="filterRecentBtn" data-translate="filterRecent">🕒 Recently Used</button>
      </div>
    `;

    const stickyBar = document.getElementById("stickyCatsBar");
    if (stickyBar) {
      stickyBar.after(filterBar);
    } else {
      toolsSec.insertBefore(filterBar, toolsSec.firstChild);
    }

    // Bind filters
    const allBtn = filterBar.querySelector("#filterAllBtn");
    const favBtn = filterBar.querySelector("#filterFavBtn");
    const recentBtn = filterBar.querySelector("#filterRecentBtn");
    const sortSelect = filterBar.querySelector("#sortSelect");

    const clearActive = () => {
      allBtn.classList.remove("active");
      favBtn.classList.remove("active");
      recentBtn.classList.remove("active");
    };

    allBtn.onclick = () => {
      clearActive();
      allBtn.classList.add("active");
      this.activeFilter = "all";
      this.render();
    };

    favBtn.onclick = () => {
      clearActive();
      favBtn.classList.add("active");
      this.activeFilter = "favorites";
      this.render();
    };

    recentBtn.onclick = () => {
      clearActive();
      recentBtn.classList.add("active");
      this.activeFilter = "recents";
      this.render();
    };

    sortSelect.onchange = () => {
      this.render();
    };
  }

  /**
   * Builds the category rows and child cards.
   */
  async render(filterQuery = "") {
    const config = this.core.getEngine("config");
    const search = this.core.getEngine("search");
    const favorites = this.core.getEngine("favorites");

    const categories = await config.getCategories();
    let toolsList = [];

    if (filterQuery.trim()) {
      toolsList = await search.search(filterQuery);
    } else {
      toolsList = await config.getTools();
    }

    this.container.innerHTML = "";

    // 1. Filter toolsList based on active button
    if (this.activeFilter === "favorites") {
      toolsList = toolsList.filter(t => favorites && favorites.isFavorite(t.id));
    } else if (this.activeFilter === "recents") {
      let recents = [];
      try {
        recents = JSON.parse(localStorage.getItem("ssdk-tool-history") || "[]");
      } catch (e) {
        console.warn("History parse failed", e);
      }
      toolsList = toolsList.filter(t => recents.some(r => r.id === t.id));
    }

    // 2. Filter toolsList by category if category selected from sticky bar
    

    // 3. Sort toolsList
    const sortSelect = document.getElementById("sortSelect");
    const sortBy = sortSelect ? sortSelect.value : "alphabetical";

    if (sortBy === "alphabetical") {
      toolsList.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "reverse") {
      toolsList.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "newest") {
      toolsList.sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0));
    } else if (sortBy === "popular") {
      toolsList.sort((a, b) => {
        const aScore = a.featured ? 100 : (a.name.charCodeAt(0) % 50);
        const bScore = b.featured ? 100 : (b.name.charCodeAt(0) % 50);
        return bScore - aScore;
      });
    } else if (sortBy === "trending") {
      toolsList.sort((a, b) => {
        const aScore = (a.name.charCodeAt(a.name.length - 1) || 0) % 100;
        const bScore = (b.name.charCodeAt(b.name.length - 1) || 0) % 100;
        return bScore - aScore;
      });
    }

    // 4. Render Recently Used section at the top (if no query and in 'All' or 'Recents' filters)
    if (!filterQuery.trim() && this.activeFilter !== "favorites") {
      let recents = [];
      try {
        recents = JSON.parse(localStorage.getItem("ssdk-tool-history") || "[]");
      } catch (e) {
        console.warn("History parse failed", e);
      }
      if (recents.length > 0) {
        this.renderRecentsSection(recents);
      }
    }

    // 5. Render Featured / Popular Section at the top if there is no query
    if (!filterQuery.trim()) {
      const featuredTools = toolsList.filter(t => t.featured === true);
      if (featuredTools.length > 0) {
        this.renderSpecialSection("⭐ Featured Utilities", featuredTools, favorites);
      }
    }

    // 6. Render standard categories
    let found = false;
    categories.sort((a, b) => a.order - b.order);

    categories.forEach(cat => {
      // Group tools under their normalized category properties
      const catTools = toolsList.filter(t => {
        const tCat = t.category.replace(/[^a-zA-Z]/g, "").toLowerCase();
        const cName = cat.name.replace(/[^a-zA-Z]/g, "").toLowerCase();
        return tCat === cName;
      });

      if (catTools.length > 0) {
        found = true;
        const block = document.createElement("div");
        block.className = filterQuery.trim() ? "cat-block open" : "cat-block";
        block.setAttribute("data-cat", cat.name);
        
        // Subcategory Grouping Logic
        const subcatGroups = {};
        const standaloneTools = [];

        catTools.forEach(t => {
          if (t.subcategory) {
            if (!subcatGroups[t.subcategory]) subcatGroups[t.subcategory] = [];
            subcatGroups[t.subcategory].push(t);
          } else {
            standaloneTools.push(t);
          }
        });

        const renderCards = (tools) => {
          return tools.map(t => {
            const isFav = favorites ? favorites.isFavorite(t.id) : false;
            const favClass = isFav ? "fav-btn on" : "fav-btn";
            const highlightedName = this.highlightMatch(this.translate(t.name), filterQuery);
            const highlightedDesc = this.highlightMatch(this.translate(t.description), filterQuery);
            
            return `
              <a class="card show" href="${this.core.prefix}/${t.url}" target="_blank">
                <button class="${favClass}" data-id="${t.id}" title="Toggle Favorite">★</button>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                  <span class="icon">${t.icon}</span>
                  <h3>${highlightedName}</h3>
                </div>
                <p>${highlightedDesc}</p>
              </a>
            `;
          }).join("");
        };

        block.innerHTML = `
          <div class="cat-head">
            <span class="left">${cat.emoji} ${this.translate(cat.name)} <span class="cnt">${catTools.length} ${this.translate("tools")}</span></span>
            <span class="arrow">▾</span>
          </div>
          <div class="cat-body"></div>
        `;

        const head = block.querySelector(".cat-head");
        const body = block.querySelector(".cat-body");
        let isRendered = false;

        const injectDOM = () => {
          if (isRendered) return;

          let catBodyHTML = "";
          if (standaloneTools.length > 0) {
            catBodyHTML += `<div class="grid">${renderCards(standaloneTools)}</div>`;
          }

          const subcatNames = Object.keys(subcatGroups).sort();
          subcatNames.forEach(subName => {
            catBodyHTML += `
              <div class="subcat-block">
                <h4 class="subcat-title">${this.translate(subName)}</h4>
                <div class="grid">${renderCards(subcatGroups[subName])}</div>
              </div>
            `;
          });

          body.innerHTML = catBodyHTML;
          isRendered = true;

          // Translate injected nodes immediately if necessary
          const activeLang = localStorage.getItem("ssdk-lang") || "en";
          if (window.ssdkTranslate) {
            window.ssdkTranslate(activeLang, body);
          }
        };

        const removeDOM = () => {
          body.innerHTML = "";
          isRendered = false;
        };

        head.onclick = () => {
          block.classList.toggle("open");
          if (block.classList.contains("open")) {
            injectDOM();
          } else {
            removeDOM();
          }
        };

        if (filterQuery.trim()) {
          injectDOM();
        }

        this.container.appendChild(block);
      }
    });

    const noResult = document.getElementById("noResult");
    if (noResult) {
      noResult.style.display = found ? "none" : "block";
      if (!found && filterQuery.trim()) {
        search.getTypoSuggestions(filterQuery).then(typoSuggestions => {
          let typoHTML = "";
          if (typoSuggestions.length > 0) {
            typoHTML = `
              <div class="typo-suggestions" style="margin-top:15px; font-size:0.95rem; color:var(--text);">
                <span>Did you mean:</span>
                ${typoSuggestions.map(s => `<button class="tag-btn typo-suggestion-btn" style="margin-left:8px; background:var(--bg3); border:1px solid var(--border); border-radius:15px; padding:4px 12px; color:var(--accent); cursor:pointer; font-weight:600;">${s}</button>`).join("")}
              </div>
            `;
          }
          
          noResult.innerHTML = `
            <div>No tools found for "${this.escapeHTML(filterQuery)}" 😕</div>
            ${typoHTML}
            <div style="margin-top: 30px; border-top: 1px dashed var(--border); padding-top: 20px;">
              <h4 style="margin-bottom:12px; color:var(--text)">💡 Popular Searches</h4>
              <div class="tags-container" style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px;">
                <button class="tag-btn popular-fallback-btn" style="background:var(--bg3); border:1px solid var(--border); border-radius:15px; padding:6px 14px; color:var(--text); cursor:pointer;">BMI Calculator</button>
                <button class="tag-btn popular-fallback-btn" style="background:var(--bg3); border:1px solid var(--border); border-radius:15px; padding:6px 14px; color:var(--text); cursor:pointer;">Image Compressor</button>
                <button class="tag-btn popular-fallback-btn" style="background:var(--bg3); border:1px solid var(--border); border-radius:15px; padding:6px 14px; color:var(--text); cursor:pointer;">PDF Compress</button>
                <button class="tag-btn popular-fallback-btn" style="background:var(--bg3); border:1px solid var(--border); border-radius:15px; padding:6px 14px; color:var(--text); cursor:pointer;">QR Code Generator</button>
              </div>
            </div>
          `;

          // Bind fallback buttons action
          noResult.querySelectorAll(".typo-suggestion-btn").forEach(btn => {
            btn.onclick = () => {
              const val = btn.textContent;
              const searchBar = document.getElementById("search");
              if (searchBar) {
                searchBar.value = val;
                searchBar.dispatchEvent(new Event("input"));
              }
            };
          });

          noResult.querySelectorAll(".popular-fallback-btn").forEach(btn => {
            btn.onclick = () => {
              const val = btn.textContent;
              const searchBar = document.getElementById("search");
              if (searchBar) {
                searchBar.value = val;
                searchBar.dispatchEvent(new Event("input"));
              }
            };
          });
        });
      } else {
        noResult.innerHTML = `No tools found 😕`;
      }
    }

    // Apply translation to all currently rendered elements
    const activeLang = localStorage.getItem("ssdk-lang") || "en";
    if (window.ssdkTranslate) {
      window.ssdkTranslate(activeLang);
    }
  }

  renderRecentsSection(recents) {
    const activeLang = localStorage.getItem("ssdk-lang") || "en";
    const translations = window.ssdkTranslations || {
      en: { recentsTitle: "🕒 Recently Visited Tools", clearHistory: "Clear History" }
    };
    const langDict = translations[activeLang] || translations["en"] || {
      recentsTitle: "🕒 Recently Visited Tools",
      clearHistory: "Clear History"
    };
    const titleText = langDict.recentsTitle;
    const clearText = langDict.clearHistory;

    const block = document.createElement("div");
    block.className = "recents-section";
    
    block.innerHTML = `
      <div class="recents-title-row">
        <h3>${titleText}</h3>
        <button class="clear-recents-btn" id="clearHistoryBtn">${clearText}</button>
      </div>
      <div class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;">
        ${recents.slice(0, 4).map(t => `
          <a class="card show" href="${this.core.prefix}/${t.url}" target="_blank">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span class="icon">${t.icon}</span>
              <h3>${t.name}</h3>
            </div>
            <p>${t.description ? t.description.substring(0, 60) + "..." : "Visited recently"}</p>
          </a>
        `).join("")}
      </div>
    `;

    block.querySelector("#clearHistoryBtn").onclick = () => {
      localStorage.removeItem("ssdk-tool-history");
      this.render();
    };

    this.container.appendChild(block);
  }

  renderSpecialSection(title, tools, favorites) {
    const block = document.createElement("div");
    block.className = "cat-block open";
    block.style.border = "1px solid var(--accent)";
    
    const cardsHTML = tools.map(t => {
      const isFav = favorites ? favorites.isFavorite(t.id) : false;
      const favClass = isFav ? "fav-btn on" : "fav-btn";
      
      return `
        <a class="card show" href="${this.core.prefix}/${t.url}" target="_blank" style="background: var(--card2)">
          <button class="${favClass}" data-id="${t.id}" title="Toggle Favorite">★</button>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span class="icon">${t.icon}</span>
            <h3>${this.translate(t.name)}</h3>
          </div>
          <p>${this.translate(t.description)}</p>
        </a>
      `;
    }).join("");

    block.innerHTML = `
      <div class="cat-head" style="background: var(--card2)">
        <span class="left">${this.translate(title)}</span>
        <span class="arrow">▾</span>
      </div>
      <div class="cat-body">
        <div class="grid">${cardsHTML}</div>
      </div>
    `;

    const head = block.querySelector(".cat-head");
    head.onclick = () => {
      block.classList.toggle("open");
    };

    block.querySelectorAll(".fav-btn").forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const targetTool = tools.find(x => x.id === id);
        if (favorites) {
          await favorites.toggleFavorite(targetTool);
          btn.classList.toggle("on", favorites.isFavorite(id));
          if (window.updateFavoritesBadge) window.updateFavoritesBadge();
        }
      };
    });

    this.container.appendChild(block);
  }

  bindSearch() {
    const searchBar = document.getElementById("search");
    const suggestionsPanel = document.getElementById("searchSuggestions");
    const suggestionsList = document.getElementById("autocompleteSuggestions");
    const suggestionsSec = document.getElementById("suggestionsSection");
    const popularContainer = document.getElementById("popularSearches");
    const recentsContainer = document.getElementById("recentSearches");
    const voiceBtn = document.getElementById("voiceSearchBtn");

    if (!searchBar) return;

    const searchEngine = this.core.getEngine("search");

    // Populate Popular Searches
    const populars = ["BMI Calculator", "Image Compressor", "PDF Compress", "QR Code", "Troponin", "Case Converter"];
    if (popularContainer) {
      popularContainer.innerHTML = populars.map(p => `<button class="tag-btn">${p}</button>`).join("");
      popularContainer.querySelectorAll(".tag-btn").forEach(btn => {
        btn.onclick = () => {
          searchBar.value = btn.textContent;
          this.render(btn.textContent);
          suggestionsPanel.classList.remove("active");
        };
      });
    }

    const updateRecentSearchesUI = () => {
      if (!recentsContainer || !searchEngine) return;
      const recents = searchEngine.getRecentSearches();
      if (recents.length > 0) {
        recentsContainer.innerHTML = recents.map(r => `<button class="tag-btn">${r}</button>`).join("");
        recentsContainer.querySelectorAll(".tag-btn").forEach(btn => {
          btn.onclick = () => {
            searchBar.value = btn.textContent;
            this.render(btn.textContent);
            suggestionsPanel.classList.remove("active");
          };
        });
      } else {
        recentsContainer.innerHTML = `<span style="font-size:0.8rem;color:var(--muted)">No recent searches.</span>`;
      }
    };

    // Show suggestions panel on focus
    searchBar.addEventListener("focus", () => {
      updateRecentSearchesUI();
      suggestionsPanel.classList.add("active");
    });

    // Hide suggestions panel on click outside
    document.addEventListener("click", (e) => {
      if (!searchBar.contains(e.target) && !suggestionsPanel.contains(e.target)) {
        suggestionsPanel.classList.remove("active");
      }
    });

    searchBar.addEventListener("input", async (e) => {
      const val = e.target.value;
      this.render(val);
      this.selectedSuggestionIndex = -1;
      
      if (searchEngine && val.trim().length > 1) {
        const suggs = await searchEngine.getSuggestions(val);
        if (suggs.length > 0) {
          suggestionsSec.style.display = "block";
          suggestionsList.innerHTML = suggs.map((s, idx) => `
            <div class="suggestion-item" data-index="${idx}">
              <span>🔍 ${s}</span>
            </div>
          `).join("");
          
          suggestionsList.querySelectorAll(".suggestion-item").forEach(item => {
            item.onclick = () => {
              const text = item.textContent.replace("🔍", "").trim();
              searchBar.value = text;
              this.render(text);
              searchEngine.addRecentSearch(text);
              suggestionsPanel.classList.remove("active");
            };
          });
        } else {
          suggestionsSec.style.display = "none";
        }
      } else {
        suggestionsSec.style.display = "none";
      }
    });

    // Keyboard Navigation for Suggestions
    searchBar.addEventListener("keydown", (e) => {
      const items = suggestionsList.querySelectorAll(".suggestion-item");
      if (items.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % items.length;
        this.highlightSuggestion(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.selectedSuggestionIndex = (this.selectedSuggestionIndex - 1 + items.length) % items.length;
        this.highlightSuggestion(items);
      } else if (e.key === "Enter") {
        if (this.selectedSuggestionIndex >= 0 && this.selectedSuggestionIndex < items.length) {
          e.preventDefault();
          const selectedText = items[this.selectedSuggestionIndex].textContent.replace("🔍", "").trim();
          searchBar.value = selectedText;
          this.render(selectedText);
          if (searchEngine) searchEngine.addRecentSearch(selectedText);
          suggestionsPanel.classList.remove("active");
        } else {
          // Normal enter pushes search history
          if (searchEngine && searchBar.value.trim().length > 1) {
            searchEngine.addRecentSearch(searchBar.value);
          }
          suggestionsPanel.classList.remove("active");
        }
      }
    });

    // Voice Search Setup
    if (voiceBtn) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        voiceBtn.style.display = "none"; // Hide if not supported
      } else {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        voiceBtn.onclick = () => {
          if (voiceBtn.classList.contains("listening")) {
            recognition.stop();
          } else {
            voiceBtn.classList.add("listening");
            recognition.start();
          }
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          searchBar.value = transcript;
          this.render(transcript);
          if (searchEngine) searchEngine.addRecentSearch(transcript);
        };

        recognition.onerror = (e) => {
          console.warn("Speech recognition error", e);
          voiceBtn.classList.remove("listening");
        };

        recognition.onend = () => {
          voiceBtn.classList.remove("listening");
        };
      }
    }

    // Global keyboard listener for '/' focus and 'Esc' blur
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== searchBar && 
          document.activeElement.tagName !== "INPUT" && 
          document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchBar.focus();
        searchBar.select();
      }
      if (e.key === "Escape") {
        suggestionsPanel.classList.remove("active");
        searchBar.blur();
      }
    });
  }

  highlightSuggestion(items) {
    items.forEach(item => item.classList.remove("selected"));
    if (this.selectedSuggestionIndex >= 0) {
      items[this.selectedSuggestionIndex].classList.add("selected");
      // Scroll into view if needed
      items[this.selectedSuggestionIndex].scrollIntoView({ block: "nearest" });
    }
  }

  initCategoryRedirectionScrolls() {
    const catToOpen = sessionStorage.getItem("ssdk-open-category");
    if (catToOpen) {
      sessionStorage.removeItem("ssdk-open-category");
      setTimeout(() => {
        const blocks = document.querySelectorAll(".cat-block");
        blocks.forEach(b => {
          const head = b.querySelector(".cat-head").textContent.toLowerCase();
          if (head.includes(catToOpen.toLowerCase())) {
            if (!b.classList.contains("open")) {
              const catHead = b.querySelector(".cat-head");
              if (catHead) catHead.click();
            }

            requestAnimationFrame(() => {
                b.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });

            return;
          }
        });
      }, 300);
    }
  }

  highlightMatch(text, query) {
    if (!query || !query.trim()) return text;
    const q = query.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const reg = new RegExp(`(${q})`, 'gi');
    return text.replace(reg, '<mark class="search-highlight" style="background:rgba(168,85,247,0.22);color:var(--accent);border-radius:4px;padding:0 2px;">$1</mark>');
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  translate(key) {
    const activeLang = localStorage.getItem("ssdk-lang") || "en";
    const dict = window.ssdkTranslations || {};
    const langDict = dict[activeLang] || {};
    return langDict[key] || key;
  }
}
