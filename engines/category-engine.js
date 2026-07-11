// SSDK Category Engine - Handles category-specific queries, mappings, and filters

export class CategoryEngine {
  constructor() {
    this.core = null;
  }

  async init(core) {
    this.core = core;
    console.log("[CategoryEngine] Initialized.");
  }

  /**
   * Retrieves all active categories sorted by design priority.
   */
  async getCategoriesList() {
    const config = this.core.getEngine("config");
    const list = await config.getCategories();
    return list.sort((a, b) => a.order - b.order);
  }

  /**
   * Retrieves all tools under a specific category name or ID.
   */
  async getToolsByCategory(categoryNameOrId) {
    const config = this.core.getEngine("config");
    const tools = await config.getTools();
    const query = categoryNameOrId.replace(/[^a-zA-Z]/g, "").toLowerCase();

    return tools.filter(t => {
      const toolCat = t.category.replace(/[^a-zA-Z]/g, "").toLowerCase();
      // Match either normalized category title or the ID
      return toolCat === query || t.category === categoryNameOrId;
    });
  }

  /**
   * Retrieves category metadata matching a specific name or ID.
   */
  async getCategoryDetails(categoryId) {
    const categories = await this.getCategoriesList();
    const cleanId = categoryId.toLowerCase().trim();
    return categories.find(c => c.id === cleanId || c.name.toLowerCase().includes(cleanId)) || null;
  }
}
