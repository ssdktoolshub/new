# SSDK Platform Engine Documentation

This reference guide is automatically compiled by the SSDK Documentation Generator. It provides description, exported class signatures, and responsibilities for all Core Orchestration and Feature engines.

---

## 1. Core Modules

### File: `bootstrap.js`

* **Purpose**: SSDK Application Bootloader - Initializes CoreEngine and mounts layout frameworks

---

### File: `core.js`

* **Purpose**: SSDK Core Engine Orchestrator
* **Exported Classes**: CoreEngine
* **Key Methods**: `determineDepth()`, `registerEngine()`, `init()`, `getEngine()`

---

### File: `sdk.js`

* **Purpose**: SSDK Developer SDK - Base class blueprint for all SSDK Tool Modules
* **Exported Classes**: SSDKTool
* **Key Methods**: `init()`, `run()`, `getInputValue()`, `setOutputValue()`, `showProgress()`, `showStatus()`, `hideStatus()`

---

## 2. Feature Engines

### File: `ai-engine.js`

* **Purpose**: SSDK AI Engine - Coordinates Natural Language Processing and Generation API actions
* **Exported Classes**: AIEngine
* **Key Methods**: `init()`, `summarize()`, `generateText()`, `localExtractiveSummarizer()`, `localTemplateWriter()`

---

### File: `analytics-engine.js`

* **Purpose**: SSDK Analytics Engine - Measures page views, operations runs, copies, and downloads metric events
* **Exported Classes**: AnalyticsEngine
* **Key Methods**: `init()`, `logEvent()`, `saveEvent()`, `syncEventToCloud()`, `getEvents()`, `clearEvents()`

---

### File: `category-engine.js`

* **Purpose**: SSDK Category Engine - Handles category-specific queries, mappings, and filters
* **Exported Classes**: CategoryEngine
* **Key Methods**: `init()`, `getCategoriesList()`, `getToolsByCategory()`, `getCategoryDetails()`

---

### File: `config-engine.js`

* **Purpose**: SSDK Config Engine - Manifest Database Loader & Parser
* **Exported Classes**: ConfigEngine
* **Key Methods**: `loadJSON()`, `getTools()`, `getCategories()`, `getFAQ()`, `getSettings()`, `getNavigation()`, `getToolById()`

---

### File: `favorites-engine.js`

* **Purpose**: SSDK Favorites Engine - Synchronizes favorited tools locally or via Firestore
* **Exported Classes**: FavoritesEngine
* **Key Methods**: `init()`, `loadLocalFavorites()`, `isFavorite()`, `toggleFavorite()`, `syncUser()`

---

### File: `firebase-engine.js`

* **Purpose**: SSDK Firebase Engine - Coordinates User Authentication & Firestore cloud backups synchronization
* **Exported Classes**: FirebaseEngine
* **Key Methods**: `init()`, `loadFirebase()`, `configureFirebase()`, `updateHeaderAuthUI()`, `logout()`

---

### File: `history-engine.js`

* **Purpose**: SSDK History Engine - Tracks and stores recently used tools locally
* **Exported Classes**: HistoryEngine
* **Key Methods**: `init()`, `getHistory()`, `addVisited()`, `clearHistory()`

---

### File: `homepage-engine.js`

* **Purpose**: SSDK Homepage Engine - Dynamically renders category blocks, tool grids, and binds searches
* **Exported Classes**: HomepageEngine
* **Key Methods**: `init()`, `mount()`, `applyHomepageMetadata()`, `render()`, `renderSpecialSection()`, `bindSearch()`, `initCategoryRedirectionScrolls()`

---

### File: `notification-engine.js`

* **Purpose**: SSDK Notification Engine - Dynamically renders custom glassmorphic status toasts
* **Exported Classes**: NotificationEngine
* **Key Methods**: `init()`, `createContainer()`, `show()`

---

### File: `plugin-engine.js`

* **Purpose**: SSDK Plugin Engine - Handles sandboxed executions of third-party modular tool plugins
* **Exported Classes**: PluginEngine
* **Key Methods**: `init()`, `setupMessageBridge()`, `mountPlugin()`, `unmountPlugin()`

---

### File: `python-engine.js`

* **Purpose**: SSDK Python Engine - Manages communication with Python FastAPI backend services & WASM Pyodide client execution
* **Exported Classes**: PythonEngine
* **Key Methods**: `init()`, `initPyodideWasm()`, `runPyodideBoot()`, `runOfflinePython()`, `runBackendTask()`, `uploadFilesTask()`

---

### File: `recommendation-engine.js`

* **Purpose**: SSDK Recommendation Engine - Ranks and offers related tools suggestions
* **Exported Classes**: RecommendationEngine
* **Key Methods**: `init()`, `getRecommendations()`

---

### File: `router-engine.js`

* **Purpose**: SSDK Router Engine - Orchestrates path resolutions and tool views dispatching
* **Exported Classes**: RouterEngine
* **Key Methods**: `init()`, `resolveRoute()`, `handleHashScrolls()`, `navigateTo()`

---

### File: `search-engine.js`

* **Purpose**: SSDK Search Engine - Indexes and fuzzy-matches tools dynamically
* **Exported Classes**: SearchEngine
* **Key Methods**: `init()`, `search()`, `getSuggestions()`, `getRecentSearches()`, `addRecentSearch()`, `clearRecentSearches()`

---

### File: `seo-engine.js`

* **Purpose**: SSDK SEO Engine - Manages dynamic page titles, descriptions, metadata and JSON-LD crawlers schemas
* **Exported Classes**: SEOEngine
* **Key Methods**: `init()`, `updateMetadata()`, `setOGMeta()`, `injectJSONLD()`, `generateSitemapXML()`

---

### File: `theme-engine.js`

* **Purpose**: SSDK Theme Engine - Coordinates Dark/Light Themes & WebGL Particle Backdrops
* **Exported Classes**: ThemeEngine
* **Key Methods**: `init()`, `boot()`, `initScrollAnimations()`, `applyTheme()`, `toggleTheme()`, `injectSparkles()`, `loadThreeJS()`, `initThreeParticles()`

---

### File: `tool-engine.js`

* **Purpose**: SSDK Tool Engine - Loads configurations, renders layouts, and runs tool actions
* **Exported Classes**: ToolEngine
* **Key Methods**: `init()`, `loadTool()`, `fetchTemplate()`, `populateMetaInfo()`, `setupControlButtons()`, `mountToolComponents()`, `renderSchemaField()`, `loadToolModule()`, `runTool()`, `getOutputContent()`, `downloadOutput()`, `clearInputs()`, `clearOutputs()`, `showProgress()`, `showStatus()`, `hideStatus()`, `loadHistoryDisplay()`, `loadRelatedTools()`, `loadFAQ()`

---

### File: `update-engine.js`

* **Purpose**: SSDK Update Engine - Tracks and manages application updates and notifications
* **Exported Classes**: UpdateEngine
* **Key Methods**: `init()`, `checkUpdates()`

---

