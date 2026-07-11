// Initialize theme immediately to prevent white flash
const savedTheme = localStorage.getItem("ssdk-theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

// Initialize scroll animations and background particles after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  // Scroll animations with IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
    io.observe(el);
  });

  // Inject floating 3D sparkles in background for a lively effect (fallback for non-WebGL/light mode or active sparkles)
  const bgFx = document.querySelector(".bg-fx");
  if (bgFx) {
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

  // Initialize interactive 3D WebGL Particle Background using Three.js
  loadThreeJS(() => {
    initThreeParticles();
  });
});

function loadThreeJS(callback) {
  if (window.THREE) {
    callback();
    return;
  }
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  script.onload = callback;
  script.onerror = () => console.warn("Failed to load Three.js CDN. Falling back to CSS sparks.");
  document.head.appendChild(script);
}

function initThreeParticles() {
  const container = document.querySelector(".bg-fx");
  if (!container || !window.THREE) return;

  // Create canvas element for Three.js
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

  // Build spherical particle structure (1200+ floating particles)
  const particleCount = 1350;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const isLightInit = document.documentElement.getAttribute("data-theme") === "light";
  const color1 = isLightInit ? new THREE.Color("#0284c7") : new THREE.Color("#4f46e5");
  const color2 = isLightInit ? new THREE.Color("#1d4ed8") : new THREE.Color("#06b6d4");

  const ratios = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    // Spherical distribution coordinates
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const radius = 3.2 + Math.random() * 2.5;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Color interpolation
    const ratio = Math.random();
    ratios[i] = ratio;
    const mixedColor = color1.clone().lerp(color2, ratio);
    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Circular texture generator using HTML5 Canvas to keep things standalone
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

  // Mouse Parallax movement variables
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / 120;
    mouseY = (e.clientY - window.innerHeight / 2) / 120;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let lastTheme = isLightInit ? "light" : "dark";

  // Render loop
  function animate() {
    requestAnimationFrame(animate);

    // Dynamic theme change check to update particle colors on the fly
    const activeTheme = document.documentElement.getAttribute("data-theme") || "dark";
    if (activeTheme !== lastTheme) {
      lastTheme = activeTheme;
      const isLightMode = activeTheme === "light";
      const c1 = isLightMode ? new THREE.Color("#0284c7") : new THREE.Color("#4f46e5");
      const c2 = isLightMode ? new THREE.Color("#1d4ed8") : new THREE.Color("#06b6d4");

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

    // Auto rotate slow rotation
    particleSystem.rotation.y += 0.0012;
    particleSystem.rotation.x += 0.0006;

    // Smooth cursor follow camera interpolation
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    camera.position.x = targetX;
    camera.position.y = -targetY;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();
}