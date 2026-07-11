// SSDK Notification Engine - Dynamically renders custom glassmorphic status toasts
// Builds a stacked vertical layout container for queuing operations events feedback.

export class NotificationEngine {
  constructor() {
    this.core = null;
    this.container = null;
  }

  async init(core) {
    this.core = core;
    this.createContainer();
  }

  createContainer() {
    // Check if container already exists (prevents duplicates on route changes)
    let container = document.getElementById("ssdk-notifications-container");
    if (container) {
      this.container = container;
      return;
    }

    this.container = document.createElement("div");
    this.container.id = "ssdk-notifications-container";
    this.container.className = "toast-container";
    
    // Injected styles for fixed positioning
    this.container.style.position = "fixed";
    this.container.style.top = "80px";
    this.container.style.right = "24px";
    this.container.style.zIndex = "99999";
    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";
    this.container.style.gap = "10px";
    this.container.style.pointerEvents = "none";

    document.body.appendChild(this.container);
  }

  /**
   * Displays a glassmorphic status notification toast.
   */
  show(message, type = "success", duration = 3500) {
    if (!this.container) this.createContainer();

    const toast = document.createElement("div");
    toast.className = `toast-item ${type}`;
    toast.style.pointerEvents = "auto";
    toast.style.background = "rgba(22, 22, 28, 0.9)";
    toast.style.backdropFilter = "blur(12px)";
    toast.style.webkitBackdropFilter = "blur(12px)";
    
    // Borders based on status type
    let borderColor = "var(--border)";
    if (type === "error") borderColor = "rgba(255, 107, 107, 0.4)";
    if (type === "warning") borderColor = "rgba(251, 191, 36, 0.4)";
    if (type === "success") borderColor = "rgba(52, 211, 153, 0.4)";
    if (type === "info") borderColor = "rgba(96, 165, 250, 0.4)";
    
    toast.style.border = `1px solid ${borderColor}`;
    toast.style.color = "var(--text)";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.25)";
    toast.style.fontSize = "0.9rem";
    toast.style.fontWeight = "600";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "10px";
    toast.style.transform = "translateX(100px)";
    toast.style.opacity = "0";
    toast.style.transition = "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s";

    let icon = "🔔";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";
    if (type === "info") icon = "ℹ️";

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    });

    // Auto dismiss
    setTimeout(() => {
      toast.style.transform = "translateX(100px)";
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 350);
    }, duration);
  }
}
