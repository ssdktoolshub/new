// SSDK Favorites Engine - Synchronizes favorited tools locally or via Firestore
// Integrates client-side favorites persistence with Cloud storage backups on auth change.

export class FavoritesEngine {
  constructor() {
    this.core = null;
    this.storageKey = "ssdk-tool-favorites";
    this.favsSet = new Set();
    this.currentUser = null;
    this.firestore = null;
  }

  async init(core) {
    this.core = core;
    this.loadLocalFavorites();
  }

  loadLocalFavorites() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const list = stored ? JSON.parse(stored) : [];
      this.favsSet = new Set(list.map(t => t.id || t));
    } catch (e) {
      console.warn("[FavoritesEngine] Failed parsing local favorites storage", e);
      this.favsSet = new Set();
    }
  }

  /**
   * Checks if a tool is favorited.
   */
  isFavorite(toolId) {
    return this.favsSet.has(toolId);
  }

  /**
   * Toggles favorite status and syncs changes to client/cloud.
   */
  async toggleFavorite(tool) {
    if (!tool || !tool.id) return;

    const notification = this.core.getEngine("notification");

    if (this.favsSet.has(tool.id)) {
      this.favsSet.delete(tool.id);
      if (notification) notification.show(`Removed ${tool.name} from Favorites`, "info");
    } else {
      this.favsSet.add(tool.id);
      if (notification) notification.show(`Added ${tool.name} to Favorites`, "success");
    }

    // Save locally
    const list = Array.from(this.favsSet);
    localStorage.setItem(this.storageKey, JSON.stringify(list));

    // Sync to Firestore if user is logged in
    if (this.currentUser && this.firestore) {
      try {
        const userDocRef = this.firestore.collection("users").doc(this.currentUser.uid);
        const dataList = [];
        const configEngine = this.core.getEngine("config");
        const allTools = await configEngine.getTools();
        
        allTools.forEach(t => {
          if (this.favsSet.has(t.id)) {
            dataList.push({ id: t.id, name: t.name, url: t.url, icon: t.icon });
          }
        });

        await userDocRef.set({ favorites: dataList }, { merge: true });
        console.log("[FavoritesEngine] Synchronized favorites with Firestore.");
      } catch (err) {
        console.warn("[FavoritesEngine] Firestore sync failed, local backup active:", err);
      }
    }
  }

  /**
   * Coordinates Firebase account sync trigger.
   */
  async syncUser(user, firestore) {
    this.currentUser = user;
    this.firestore = firestore;

    if (user && firestore) {
      try {
        const userDoc = await firestore.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
          const cloudFavs = userDoc.data().favorites || [];
          cloudFavs.forEach(f => this.favsSet.add(f.id || f));
          
          // Save merged favorites back locally
          localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.favsSet)));
          console.log("[FavoritesEngine] Merged local and cloud favorites.");
        }
      } catch (e) {
        console.warn("[FavoritesEngine] Cloud download failed:", e);
      }
    } else {
      this.currentUser = null;
      this.firestore = null;
    }
  }
}
