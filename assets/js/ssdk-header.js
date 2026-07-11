// Calculate directory depth dynamically
const isSub = window.location.pathname.includes("/pages/") || window.location.pathname.includes("/tools/") || window.location.pathname.includes("/categories/");
const prefix = isSub ? ".." : ".";

// Header HTML injection (runs synchronously on load)
document.body.insertAdjacentHTML("afterbegin", `
<nav id="nav">
  <a href="${prefix}/index.html" class="logo">
    <img src="${prefix}/assets/images/logo.png" alt="SSDK">
    <div class="logo-text-container">
      <span class="logo-title"><span class="brand-ssdk">SSDK</span> <span class="brand-th">Tools Hub</span></span>
      <span class="logo-tagline">One Platform. Every Tool You Need.</span>
    </div>
  </a>

  <button class="burger" id="burger">☰</button>

  <div class="nav-links" id="navLinks">
    <a href="${prefix}/index.html">Home</a>
    <a href="${prefix}/index.html#favorites" id="navFavsLink">Favorites <span class="fav-badge" id="favBadge" style="display:none">0</span></a>

    <div class="dropdown">
      <a>Categories ▾</a>
      <div class="dropdown-menu" id="dropCats"></div>
    </div>

    <a href="${prefix}/pages/about.html">About</a>
    <a href="${prefix}/pages/contact.html">Contact</a>
    <a href="${prefix}/pages/login.html" id="navAuthBtn" class="toggle" style="border-radius:30px;padding:8px 20px;">Login</a>
    
    <select id="langSelect" style="background:transparent;border:1px solid var(--border);border-radius:15px;color:var(--text);outline:none;cursor:pointer;font-weight:600;font-size:0.85rem;padding:4px 8px;margin-right:10px;">
      <option value="en">🌐 English</option>
      <option value="bn">🌐 বাংলা</option>
      <option value="hi">🌐 हिन्दी</option>
    </select>
    
    <button class="toggle" id="themeBtn">🌙 Dark</button>
  </div>
</nav>
`);

// Hamburger Menu Toggle
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");
if (burger && navLinks) {
  burger.onclick = () => {
    const isOpen = navLinks.classList.toggle("open");
    if (!isOpen) {
      const dropdown = document.querySelector(".dropdown");
      if (dropdown) dropdown.classList.remove("open");
    }
  };
}

// Theme toggler handling
const themeBtn = document.getElementById("themeBtn");
if (themeBtn) {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  themeBtn.textContent = currentTheme === "dark" ? "☀️ Light" : "🌙 Dark";
  
  themeBtn.onclick = () => {
    const nextTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("ssdk-theme", nextTheme);
    themeBtn.textContent = nextTheme === "dark" ? "☀️ Light" : "🌙 Dark";
  };
}

// Scroll styling navigation effect
window.addEventListener("scroll", () => {
  const nav = document.getElementById("nav");
  if (nav) {
    if (window.scrollY > 20) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  }
});

function normalizeCat(str) {
  return (str || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

// Helper function to open category smoothly on landing page
function openCategoryOnLanding(cat) {
  setTimeout(() => {
    const blocks = document.querySelectorAll(".cat-block");
    let matched = false;
    const normCat = normalizeCat(cat);
    blocks.forEach(b => {
      const dataCat = b.getAttribute("data-cat") || "";
      const head = b.querySelector(".cat-head").textContent;
      if (normalizeCat(dataCat).includes(normCat) || normalizeCat(head).includes(normCat)) {
        // Since blocks are open by default now, we just need to scroll
        b.classList.add("open");
        b.scrollIntoView({ behavior: "smooth", block: "start" });
        b.querySelectorAll('.card').forEach(c => c.classList.add('show'));
        matched = true;
      }
    });
    if (!matched && blocks.length === 0) {
      setTimeout(() => openCategoryOnLanding(cat), 100);
    }
  }, 100);
}

// Populate Categories dropdown menu (All 23 categories)
const categories = [
  "⚡ AI Tools",
  "🖼 Image Tools",
  "📄 PDF Tools",
  "🔤 Text Tools",
  "📁 File Tools",
  "🎥 Video Tools",
  "🔊 Audio Tools",
  "🛠 Developer Tools",
  "🌐 Web Tools",
  "📊 SEO Tools",
  "📱 Social Media Tools",
  "🔐 Security Tools",
  "🎨 Color Tools",
  "💵 Finance Tools",
  "🎓 Education Tools",
  "💼 Business Tools",
  "📈 Marketing Tools",
  "🩺 Medical & Laboratory Tools",
  "🏥 Health Calculators",
  "🔄 Unit Converters",
  "🔬 Scientific Calculators",
  "🍀 Lifestyle Tools",
  "⚙️ Utility Tools"
];

const dropCats = document.getElementById("dropCats");
if (dropCats) {
  categories.forEach(cat => {
    const a = document.createElement("a");
    a.href = `${prefix}/index.html#tools`;
    a.textContent = cat;
    a.onclick = (e) => {
      e.preventDefault();
      if (navLinks) navLinks.classList.remove("open");
      const dropdown = document.querySelector(".dropdown");
      if (dropdown) dropdown.classList.remove("open");
      
      const onLandingPage = document.getElementById("toolContainer") !== null;
      if (onLandingPage) {
        openCategoryOnLanding(cat);
      } else {
        sessionStorage.setItem("ssdk-open-category", cat);
        window.location.href = `${prefix}/index.html`;
      }
    };
    dropCats.appendChild(a);
  });
}

// Check sessionStorage on page load to expand and scroll to requested category
window.addEventListener("DOMContentLoaded", () => {
  const onLandingPage = document.getElementById("toolContainer") !== null;
  if (onLandingPage) {
    const catToOpen = sessionStorage.getItem("ssdk-open-category");
    if (catToOpen) {
      sessionStorage.removeItem("ssdk-open-category");
      openCategoryOnLanding(catToOpen);
    }
  }
});

// Expose Auth update globally so pages can push logins
window.updateHeaderAuth = (user) => {
  const authBtn = document.getElementById("navAuthBtn");
  if (authBtn) {
    if (user) {
      authBtn.href = `${prefix}/pages/dashboard.html`;
      authBtn.textContent = user.displayName || user.email.split("@")[0].substring(0, 8) + " (Dash)";
      authBtn.style.border = "1px solid var(--accent)";
      authBtn.style.color = "var(--accent)";
    } else {
      authBtn.href = `${prefix}/pages/login.html`;
      authBtn.textContent = "Login";
      authBtn.style.border = "1px solid var(--border)";
      authBtn.style.color = "var(--text)";
    }
  }
};

// Safe Auth check on HTTP/HTTPS servers. Local file:// skips this to prevent CORS errors.
if (window.location.protocol !== 'file:') {
  const fApp = document.createElement('script');
  fApp.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js";
  fApp.onload = () => {
    const fAuth = document.createElement('script');
    fAuth.src = "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js";
    fAuth.onload = () => {
      const config = {
        apiKey: "AIzaSyCmRITivfWsD2YZDijcRh8xqXrwzL3B0e4",
        authDomain: "ssdk-tools-hub.firebaseapp.com",
        projectId: "ssdk-tools-hub",
        storageBucket: "ssdk-tools-hub.firebasestorage.app",
        messagingSenderId: "135148967233",
        appId: "1:135148967233:web:ca98f8eb2e9a1717877dc0",
        measurementId: "G-4Y0CR0BSWQ"
      };
      if (window.firebase && !firebase.apps.length) {
        firebase.initializeApp(config);
      }
      if (window.firebase) {
        firebase.auth().onAuthStateChanged((user) => {
          window.updateHeaderAuth(user);
        });
      }
    };
    document.head.appendChild(fAuth);
  };
  document.head.appendChild(fApp);
}

// Dropdown click handler for mobile touch screens
setTimeout(() => {
  const dropToggle = document.querySelector(".dropdown > a");
  if (dropToggle) {
    dropToggle.addEventListener("click", (e) => {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        e.stopPropagation();
        const parent = dropToggle.parentElement;
        if (parent) {
          parent.classList.toggle("open");
        }
      }
    });
  }
}, 100);

// --- premium SEO injection ---
function applyDynamicSEO() {
  const path = window.location.pathname;
  if (path.includes("/tools/") && !path.includes("tool-template.html")) {
    const toolId = path.split("/").pop().replace(".html", "");
    
    fetch(`${prefix}/assets/json/tools.json`)
      .then(r => r.json())
      .then(tools => {
        const tool = tools.find(t => t.id === toolId || t.url.endsWith(`${toolId}.html`));
        if (tool) {
          // Meta tags
          document.title = `${tool.name} - SSDK Tools Hub`;
          
          let descMeta = document.querySelector('meta[name="description"]');
          if (!descMeta) {
            descMeta = document.createElement('meta');
            descMeta.name = "description";
            document.head.appendChild(descMeta);
          }
          descMeta.content = tool.description;
          
          // OpenGraph
          let ogTitle = document.querySelector('meta[property="og:title"]');
          if (!ogTitle) {
            ogTitle = document.createElement('meta');
            ogTitle.setAttribute('property', 'og:title');
            document.head.appendChild(ogTitle);
          }
          ogTitle.content = `${tool.name} - SSDK Tools Hub`;
          
          let ogDesc = document.querySelector('meta[property="og:description"]');
          if (!ogDesc) {
            ogDesc = document.createElement('meta');
            ogDesc.setAttribute('property', 'og:description');
            document.head.appendChild(ogDesc);
          }
          ogDesc.content = tool.description;

          // Canonical Link
          let canonical = document.querySelector('link[rel="canonical"]');
          if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
          }
          canonical.href = window.location.href;

          // Schema Markup (JSON-LD)
          let schemaScript = document.getElementById("ssdk-seo-schema");
          if (!schemaScript) {
            schemaScript = document.createElement("script");
            schemaScript.id = "ssdk-seo-schema";
            schemaScript.type = "application/ld+json";
            document.head.appendChild(schemaScript);
          }
          schemaScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": tool.name,
            "description": tool.description,
            "applicationCategory": "Utility",
            "operatingSystem": "All"
          });
        }
      }).catch(e => console.error("SEO Injector failed", e));
  }
}
applyDynamicSEO();

// --- History Tracker ---
const path = window.location.pathname;
if (path.includes("/tools/") && !path.includes("tool-template.html")) {
  const toolId = path.split("/").pop().replace(".html", "");
  fetch(`${prefix}/assets/json/tools.json`)
    .then(r => r.json())
    .then(tools => {
      const tool = tools.find(t => t.id === toolId || t.url.endsWith(`${toolId}.html`));
      if (tool) {
        let history = JSON.parse(localStorage.getItem("ssdk-tool-history") || "[]");
        history = history.filter(h => h.id !== tool.id);
        history.unshift({
          id: tool.id,
          name: tool.name,
          icon: tool.icon,
          url: tool.url,
          visitedAt: new Date().toISOString()
        });
        if (history.length > 10) history.pop();
        localStorage.setItem("ssdk-tool-history", JSON.stringify(history));
      }
    }).catch(e => console.error("History logging failed", e));
}

// --- Favorites Interceptor ---
function updateFavoritesBadge() {
  const favs = JSON.parse(localStorage.getItem("ssdk-tool-favorites") || "[]");
  const badge = document.getElementById("favBadge");
  if (badge) {
    if (favs.length > 0) {
      badge.textContent = favs.length;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toolFavBtn");
  if (btn) {
    const path = window.location.pathname;
    const toolId = path.split("/").pop().replace(".html", "");
    
    let favorites = JSON.parse(localStorage.getItem("ssdk-tool-favorites") || "[]");
    const isFav = favorites.includes(toolId);
    btn.classList.toggle("on", isFav);
    
    btn.onclick = () => {
      let favs = JSON.parse(localStorage.getItem("ssdk-tool-favorites") || "[]");
      let active = false;
      if (favs.includes(toolId)) {
        favs = favs.filter(id => id !== toolId);
      } else {
        favs.push(toolId);
        active = true;
      }
      localStorage.setItem("ssdk-tool-favorites", JSON.stringify(favs));
      btn.classList.toggle("on", active);
      updateFavoritesBadge();
    };
  }
  
  // Multilingual Handler
  const langSelect = document.getElementById("langSelect");
  if (langSelect) {
    const savedLang = localStorage.getItem("ssdk-lang") || "en";
    langSelect.value = savedLang;
    langSelect.onchange = () => {
      const selected = langSelect.value;
      localStorage.setItem("ssdk-lang", selected);
      window.ssdkTranslate(selected);
      window.dispatchEvent(new CustomEvent("ssdk-lang-change", { detail: selected }));
    };
    setTimeout(() => {
      window.ssdkTranslate(savedLang);
    }, 150);
  }
  
  updateFavoritesBadge();
});

// Translation Engine Global
window.ssdkTranslations = {
  en: {
    heroTitle: "SSDK TOOLS HUB",
    heroSub: "Designed to inspire. Built to create. Aesthetic tools for the modern creator — 150+ free online tools in one place, accessible without login.",
    exploreTitle: "Explore Tool Categories",
    exploreSub: "Click a category to open its tools, or use the dropdown in the menu",
    searchPlaceholder: "🔍 Search 150+ tools... (e.g. PDF, QR, Medical, JSON)",
    filterAll: "All Tools",
    filterFav: "⭐ Favorites",
    filterRecent: "🕒 Recently Used",
    noResult: "No tools found 😕",
    recentsTitle: "🕒 Recently Visited Tools",
    clearHistory: "Clear History",
    featuredTitle: "⭐ Featured Utilities",
    // Categories
    "AI Tools": "AI Tools",
    "Image Tools": "Image Tools",
    "PDF Tools": "PDF Tools",
    "Text Tools": "Text Tools",
    "File Tools": "File Tools",
    "Video Tools": "Video Tools",
    "Audio Tools": "Audio Tools",
    "Developer Tools": "Developer Tools",
    "Web Tools": "Web Tools",
    "SEO Tools": "SEO Tools",
    "Social Media Tools": "Social Media Tools",
    "Security Tools": "Security Tools",
    "Color Tools": "Color Tools",
    "Finance Tools": "Finance Tools",
    "Education Tools": "Education Tools",
    "Business Tools": "Business Tools",
    "Marketing Tools": "Marketing Tools",
    "Medical & Laboratory Tools": "Medical & Laboratory Tools",
    "Health Calculators": "Health Calculators",
    "Unit Converters": "Unit Converters",
    "Database Tools": "Database Tools",
    "Design Tools": "Design Tools",
    "Miscellaneous Tools": "Miscellaneous Tools",
    "tools": "tools",
    // Subcategories
    "Formatters & Parsers": "Formatters & Parsers",
    "Image Processing": "Image Processing",
    "PDF Utilities": "PDF Utilities",
    "Coagulation": "Coagulation",
    "Thyroid": "Thyroid",
    "Iron Panel": "Iron Panel",
    "Blood Panel": "Blood Panel",
    "Vitamins": "Vitamins",
    "Urine & Kidneys": "Urine & Kidneys",
    "Cardiac Biomarkers": "Cardiac Biomarkers",
    "Generators": "Generators"
  },
  bn: {
    heroTitle: "এসএসডিকে টুলস হাব",
    heroSub: "অনুপ্রেরণার জন্য ডিজাইন করা। তৈরি করার জন্য নির্মিত। আধুনিক নির্মাতাদের জন্য নান্দনিক টুলস — ১৫০টিরও বেশি ফ্রি অনলাইন টুলস এক জায়গায়, লগইন ছাড়াই ব্যবহার করুন।",
    exploreTitle: "টুলস ক্যাটাগরি এক্সপ্লোর করুন",
    exploreSub: "টুলস খুলতে একটি ক্যাটাগরি ক্লিক করুন, বা মেনুর ড্রপডাউন ব্যবহার করুন",
    searchPlaceholder: "🔍 ১৫০+ টুলস খুঁজুন... (যেমন PDF, QR, Medical, JSON)",
    filterAll: "সব টুলস",
    filterFav: "⭐ ফেভারিট",
    filterRecent: "🕒 সম্প্রতি ব্যবহৃত",
    noResult: "কোনো টুলস পাওয়া যায়নি 😕",
    recentsTitle: "🕒 সম্প্রতি পরিদর্শিত টুলস",
    clearHistory: "ইতিহাস মুছুন",
    featuredTitle: "⭐ নির্বাচিত ইউটিলিটি",
    // Categories
    "AI Tools": "এআই টুলস",
    "Image Tools": "ইমেজ টুলস",
    "PDF Tools": "পিডিএফ টুলস",
    "Text Tools": "টেক্সট টুলস",
    "File Tools": "ফাইল টুলস",
    "Video Tools": "ভিডিও টুলস",
    "Audio Tools": "অডিও টুলস",
    "Developer Tools": "ডেভেলপার টুলস",
    "Web Tools": "ওয়েব টুলস",
    "SEO Tools": "এসইও টুলস",
    "Social Media Tools": "সোশ্যাল মিডিয়া টুলস",
    "Security Tools": "সিকিউরিটি টুলস",
    "Color Tools": "কালার টুলস",
    "Finance Tools": "ফাইন্যান্স টুলস",
    "Education Tools": "এডুকেশন টুলস",
    "Business Tools": "বিজনেস টুলস",
    "Marketing Tools": "মার্কেটিং টুলস",
    "Medical & Laboratory Tools": "মেডিকেল ও ল্যাবরেটরি টুলস",
    "Health Calculators": "হেলথ ক্যালকুলেটরস",
    "Unit Converters": "ইউনিট কনভার্টারস",
    "Database Tools": "ডাটাবেস টুলস",
    "Design Tools": "ডিজাইন টুলস",
    "Miscellaneous Tools": "অন্যান্য টুলস",
    "tools": "টুলস",
    // Subcategories
    "Formatters & Parsers": "ফরম্যাটার ও পার্সার",
    "Image Processing": "ইমেজ প্রসেসিং",
    "PDF Utilities": "পিডিএফ ইউটিলিটি",
    "Coagulation": "কোয়াগুলেশন",
    "Thyroid": "থাইরয়েড",
    "Iron Panel": "আয়রন প্যানেল",
    "Blood Panel": "ব্লাড প্যানেল",
    "Vitamins": "ভিটামিন",
    "Urine & Kidneys": "ইউরিন ও কিডনি",
    "Cardiac Biomarkers": "কার্ডিয়াক বায়োমার্কার",
    "Generators": "জেনারেটর"
  },
  hi: {
    heroTitle: "एसएसडीके टूल्स हब",
    heroSub: "प्रेरणा के लिए डिज़ाइन किया गया। बनाने के लिए निर्मित। आधुनिक रचनाकारों के लिए सौंदर्य उपकरण — एक ही स्थान पर 150+ मुफ्त ऑनलाइन उपकरण, बिना लॉगिन के उपलब्ध।",
    exploreTitle: "टूल्स श्रेणियों का अन्वेषण करें",
    exploreSub: "टूल्स खोलने के लिए किसी श्रेणी पर क्लिक करें, या मेनू में ड्रॉपडाउन का उपयोग करें",
    searchPlaceholder: "🔍 150+ टूल्स खोजें... (जैसे PDF, QR, Medical, JSON)",
    filterAll: "सभी टूल्स",
    filterFav: "⭐ पसंदीदा",
    filterRecent: "🕒 हाल ही में प्रयुक्त",
    noResult: "कोई टूल नहीं मिला 😕",
    recentsTitle: "🕒 हाल ही में देखे गए टूल्स",
    clearHistory: "इतिहास साफ़ करें",
    featuredTitle: "⭐ चुनिंदा यूटिलिटीज",
    // Categories
    "AI Tools": "एआई टूल्स",
    "Image Tools": "इमेज टूल्स",
    "PDF Tools": "पीडीएफ टूल्स",
    "Text Tools": "टेक्स्ट टूल्स",
    "File Tools": "फाइल टूल्स",
    "Video Tools": "वीडियो टूल्स",
    "Audio Tools": "ऑडियो टूल्स",
    "Developer Tools": "डेवलपर टूल्स",
    "Web Tools": "वेब टूल्स",
    "SEO Tools": "एसईओ टूल्स",
    "Social Media Tools": "सोशल मीडिया टूल्स",
    "Security Tools": "सुरक्षा टूल्स",
    "Color Tools": "रंग टूल्स",
    "Finance Tools": "वित्त टूल्स",
    "Education Tools": "शिक्षा टूल्स",
    "Business Tools": "व्यावसायिक टूल्स",
    "Marketing Tools": "विपणन टूल्स",
    "Medical & Laboratory Tools": "चिकित्सा और प्रयोगशाला टूल्स",
    "Health Calculators": "स्वास्थ्य कैलकुलेटर",
    "Unit Converters": "इकाई कनवर्टर",
    "Database Tools": "डेटाबेस टूल्स",
    "Design Tools": "डिज़ाइन टूल्स",
    "Miscellaneous Tools": "विविध टूल्स",
    "tools": "टूल्स",
    // Subcategories
    "Formatters & Parsers": "फ़ॉर्मेटर और पार्सर",
    "Image Processing": "छवि प्रसंस्करण",
    "PDF Utilities": "पीडीएफ उपयोगिताएँ",
    "Coagulation": "जमावट",
    "Thyroid": "थायराइड",
    "Iron Panel": "आयरन पैनल",
    "Blood Panel": "रक्त पैनल",
    "Vitamins": "विटामिन",
    "Urine & Kidneys": "मूत्र और गुर्दे",
    "Cardiac Biomarkers": "कार्डियक बायोमार्कर",
    "Generators": "जेनरेटर"
  }
};

window.ssdkTranslateKey = (key) => {
  const lang = localStorage.getItem("ssdk-lang") || "en";
  const dict = window.ssdkTranslations || {};
  const langDict = dict[lang] || {};
  return langDict[key] || key;
};

window.ssdkTranslate = (lang = "en") => {
  document.querySelectorAll("[data-translate]").forEach(el => {
    const key = el.getAttribute("data-translate");
    const langDict = window.ssdkTranslations ? window.ssdkTranslations[lang] : null;
    if (langDict && langDict[key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = langDict[key];
      } else {
        el.innerHTML = langDict[key];
      }
    }
  });
  
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.placeholder = window.ssdkTranslations[lang].searchPlaceholder;
  }
  
  const navLinks = document.getElementById("navLinks");
  if (navLinks) {
    const homeLink = navLinks.querySelector("a[href*='index.html']:not([href*='#'])");
    if (homeLink) homeLink.textContent = lang === "bn" ? "হোম" : (lang === "hi" ? "होम" : "Home");
    
    const favLink = document.getElementById("navFavsLink");
    if (favLink) {
      const badge = document.getElementById("favBadge");
      const badgeText = badge ? badge.outerHTML : "";
      favLink.innerHTML = (lang === "bn" ? "ফেভারিট " : (lang === "hi" ? "पसंदीदा " : "Favorites ")) + badgeText;
    }
    
    const catLink = navLinks.querySelector(".dropdown-trigger") || navLinks.querySelector(".dropdown > a");
    if (catLink) catLink.textContent = lang === "bn" ? "ক্যাটাগরি ▾" : (lang === "hi" ? "श्रेणियां ▾" : "Categories ▾");
    
    const aboutLink = navLinks.querySelector("a[href*='about.html']");
    if (aboutLink) aboutLink.textContent = lang === "bn" ? "সম্পর্কে" : (lang === "hi" ? "हमारे बारे में" : "About");
    
    const contactLink = navLinks.querySelector("a[href*='contact.html']");
    if (contactLink) contactLink.textContent = lang === "bn" ? "যোগাযোগ" : (lang === "hi" ? "সম্পর্ক" : "Contact");
  }

  // Rebuild categories dropdown menu with translations
  const dropCats = document.getElementById("dropCats");
  if (dropCats) {
    dropCats.innerHTML = "";
    categories.forEach(cat => {
      const a = document.createElement("a");
      a.href = `${prefix}/index.html#tools`;
      const translatedName = window.ssdkTranslateKey ? window.ssdkTranslateKey(cat) : cat;
      a.textContent = translatedName;
      a.onclick = (e) => {
        e.preventDefault();
        if (navLinks) navLinks.classList.remove("open");
        const dropdown = document.querySelector(".dropdown");
        if (dropdown) dropdown.classList.remove("open");
        
        sessionStorage.setItem("ssdk-open-category", cat);
        window.location.href = `${prefix}/index.html`;
      };
      dropCats.appendChild(a);
    });
  }
};