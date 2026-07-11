// SSDK Theme Engine - Coordinates Dark/Light Themes & WebGL Particle Backdrops
// Handles animations throttle, local cache checks, and Three.js canvas setup.

export class ThemeEngine {
  constructor() {
    this.core = null;
    this.currentTheme = "dark";
    this.particles = null;
    this.observer = null;
  }

  async init(core) {
    this.core = core;
    this.currentTheme = localStorage.getItem("ssdk-theme") || "dark";
    this.applyTheme(this.currentTheme);
    
    // Bind listeners after DOM loads
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.boot());
    } else {
      this.boot();
    }
  }

  boot() {
    this.injectSparkles();
    this.initScrollAnimations();
    this.loadThreeJS(() => this.initThreeParticles());
  }

  initScrollAnimations() {
    // Disconnect old observer if resetting
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
      this.observer.observe(el);
    });
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ssdk-theme", theme);
    
    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) {
      themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
    }
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(nextTheme);
  }

  injectSparkles() {
    const bgFx = document.querySelector(".bg-fx");
    if (!bgFx) return;

    // Check if sparkles are already injected to prevent duplication
    if (bgFx.querySelector(".sparkle")) return;

    const isMobile = window.innerWidth <= 768;
    const sparkleCount = isMobile ? 8 : 20;
    
    for (let i = 0; i < sparkleCount; i++) {
      const sp = document.createElement("span");
      sp.className = "sparkle";
      sp.innerHTML = Math.random() > 0.5 ? "✦" : "★";
      sp.style.left = (Math.random() * 100) + "%";
      sp.style.top = (Math.random() * 100) + "%";
      sp.style.fontSize = (Math.random() * (isMobile ? 0.8 : 1.3) + 0.3) + "rem";
      sp.style.animationDelay = (Math.random() * 6) + "s";
      sp.style.animationDuration = (Math.random() * 6 + 4) + "s";
      if (Math.random() > 0.6) {
        sp.style.color = "#ffffff";
      }
      bgFx.appendChild(sp);
    }
  }

  loadThreeJS(callback) {
    if (window.THREE) {
      callback();
      return;
    }
    // Check if script element is already added to prevent duplicate tags
    if (document.querySelector('script[src*="three.min.js"]')) {
      // Script is loading; poll until window.THREE is available
      const interval = setInterval(() => {
        if (window.THREE) {
          clearInterval(interval);
          callback();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = callback;
    script.onerror = () => console.warn("[ThemeEngine] Could not load Three.js CDN. Sparkles fallback active.");
    document.head.appendChild(script);
  }

  initThreeParticles() {
    const container = document.querySelector(".bg-fx");
    if (!container || !window.THREE) return;

    // Prevent double canvas creation
    if (document.getElementById("three-bg-canvas")) return;

    const canvas = document.createElement("canvas");
    canvas.id = "three-bg-canvas";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "-1";
    canvas.style.pointerEvents = "none";
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particleCount = window.innerWidth <= 768 ? 600 : 1350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color("#7C3AED");
    const color2 = new THREE.Color("#A855F7");

    const ratios = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 3.2 + Math.random() * 2.5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const ratio = Math.random();
      ratios[i] = ratio;
      const mixedColor = color1.clone().lerp(color2, ratio);
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pCanvas = document.createElement("canvas");
    pCanvas.width = 16;
    pCanvas.height = 16;
    const ctx = pCanvas.getContext("2d");
    const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 16, 16);
    const particleTexture = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: isLightInit ? 0.85 : 0.65,
      map: particleTexture,
      blending: isLightInit ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;

    const onMouseMove = (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) / 120;
      mouseY = (e.clientY - window.innerHeight / 2) / 120;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let lastTheme = this.currentTheme;

    const animate = () => {
      // Check if canvas is still attached (to handle SPA transitions cleanups)
      if (!document.getElementById("three-bg-canvas")) {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        return;
      }

      requestAnimationFrame(animate);

      // Check for theme switches dynamically
      if (this.currentTheme !== lastTheme) {
        lastTheme = this.currentTheme;
        const c1 = new THREE.Color("#7C3AED");
        const c2 = new THREE.Color("#A855F7");

        const colorsAttr = geometry.attributes.color;
        for (let i = 0; i < particleCount; i++) {
          const ratio = ratios[i];
          const mixed = c1.clone().lerp(c2, ratio);
          colorsAttr.setXYZ(i, mixed.r, mixed.g, mixed.b);
        }
        colorsAttr.needsUpdate = true;

        material.blending = isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
        material.opacity = isLightMode ? 0.85 : 0.65;
        material.needsUpdate = true;
      }

      particleSystem.rotation.y += 0.0012;
      particleSystem.rotation.x += 0.0006;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      camera.position.x = targetX;
      camera.position.y = -targetY;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();
  }
}
