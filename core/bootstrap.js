// SSDK Application Bootloader - Initializes CoreEngine and mounts layout frameworks

import { CoreEngine } from "./core.js";
import { ErrorEngine } from "../engines/error-engine.js";
import { ThemeEngine } from "../engines/theme-engine.js";
import { RouterEngine } from "../engines/router-engine.js";
import { ToolEngine } from "../engines/tool-engine.js";
import { SearchEngine } from "../engines/search-engine.js";
import { HistoryEngine } from "../engines/history-engine.js";
import { FavoritesEngine } from "../engines/favorites-engine.js";
import { SEOEngine } from "../engines/seo-engine.js";
import { HomepageEngine } from "../engines/homepage-engine.js";
import { AnalyticsEngine } from "../engines/analytics-engine.js";
import { NotificationEngine } from "../engines/notification-engine.js";
import { RecommendationEngine } from "../engines/recommendation-engine.js";
import { FirebaseEngine } from "../engines/firebase-engine.js";
import { PythonEngine } from "../engines/python-engine.js";
import { AIEngine } from "../engines/ai-engine.js";
import { PluginEngine } from "../engines/plugin-engine.js";
import { UpdateEngine } from "../engines/update-engine.js";
import { CategoryEngine } from "../engines/category-engine.js";
import { StateEngine } from "../engines/state-engine.js";
import { AdminEngine } from "../engines/admin-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[Bootstrap] Booting SSDK Tools Hub platform...");

  // 1. Initialize Core Engine Orchestrator
  const core = new CoreEngine();
  window.SSDKCore = core;

  // 2. Register all support modules
  await core.registerEngine("error", new ErrorEngine());
  await core.registerEngine("theme", new ThemeEngine());
  await core.registerEngine("router", new RouterEngine());
  await core.registerEngine("tool", new ToolEngine());
  await core.registerEngine("search", new SearchEngine());
  await core.registerEngine("history", new HistoryEngine());
  await core.registerEngine("favorites", new FavoritesEngine());
  await core.registerEngine("seo", new SEOEngine());
  await core.registerEngine("homepage", new HomepageEngine());
  await core.registerEngine("analytics", new AnalyticsEngine());
  await core.registerEngine("notification", new NotificationEngine());
  await core.registerEngine("recommendation", new RecommendationEngine());
  await core.registerEngine("firebase", new FirebaseEngine());
  await core.registerEngine("python", new PythonEngine());
  await core.registerEngine("ai", new AIEngine());
  await core.registerEngine("plugin", new PluginEngine());
  await core.registerEngine("update", new UpdateEngine());
  await core.registerEngine("category", new CategoryEngine());
  await core.registerEngine("state", new StateEngine());
  await core.registerEngine("admin", new AdminEngine());

  // 3. Boot the Core Orchestration
  await core.init();

  // 4. Dynamically Render Header & Footer Layouts
  await renderLayoutFramework(core);

  // 5. Register Service Worker for offline support and speed caching
  const prefix = core.prefix;
  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    navigator.serviceWorker.register(`${prefix}/sw.js`)
      .then(reg => console.log("[Bootstrap] ServiceWorker registered with scope:", reg.scope))
      .catch(err => console.error("[Bootstrap] ServiceWorker registration failed:", err));
  }
});

async function renderLayoutFramework(core) {
  const prefix = core.prefix;
  const config = core.getEngine("config");
  const categoriesList = await config.getCategories();
  
  // Inject Header
  renderHeader(prefix, categoriesList);
  
  // Inject Footer
  renderFooter(prefix);

  // Initialize theme controls and auth listeners in header
  setupHeaderControls(core);
}

function renderHeader(prefix, categories) {
  window.ssdkHeaderPrefix = prefix;
  window.ssdkHeaderCategories = categories;
  
  const navHTML = `
    <nav id="nav">
      <a href="${prefix}/index.html" class="logo">
        <img src="${prefix}/assets/images/logo.png" alt="SSDK">
        <div class="logo-text-container">
          <span class="logo-title"><span class="brand-ssdk">SSDK</span> <span class="brand-th">Tools Hub</span></span>
          <span class="logo-tagline">One Platform. Every Tool You Need.</span>
        </div>
      </a>
      <button class="burger" id="burger" aria-label="Toggle navigation">☰</button>
      <div class="nav-links" id="navLinks">
        <a href="${prefix}/index.html">Home</a>
        <a href="${prefix}/index.html#favorites" id="navFavsLink">Favorites <span class="fav-badge" id="favBadge" style="display:none">0</span></a>
        <div class="dropdown">
          <a class="dropdown-trigger">Categories ▾</a>
          <div class="dropdown-menu" id="dropCats"></div>
        </div>
        <a href="${prefix}/pages/about.html">About</a>
        <a href="${prefix}/pages/contact.html">Contact</a>
        <a href="${prefix}/pages/login.html" id="navAuthBtn" class="toggle">Login</a>
        
        <select id="langSelect" style="background:transparent;border:1px solid var(--border);border-radius:15px;color:var(--text);outline:none;cursor:pointer;font-weight:600;font-size:0.85rem;padding:4px 8px;margin-right:10px;">
          <option value="en">🌐 English</option>
          <option value="bn">🌐 বাংলা</option>
          <option value="hi">🌐 हिन्दी</option>
        </select>
        
        <button class="toggle" id="themeBtn">🌙 Dark</button>
      </div>
    </nav>
  `;
  document.body.insertAdjacentHTML("afterbegin", navHTML);

  // Trigger initial translation which renders dropCats categories dropdown menu
  const savedLang = localStorage.getItem("ssdk-lang") || "en";
  window.ssdkTranslate(savedLang);
}

function renderFooter(prefix) {
  const footerHTML = `
    <footer>
      <div class="foot-grid">
        <div>
          <h4><span class="brand-ssdk">SSDK</span> <span class="brand-th">Tools Hub</span></h4>
          <p>Designed to inspire. Built to create. Professional multi-tool platform with advanced utilities.</p>
        </div>
        <div>
          <h4>Information</h4>
          <a href="${prefix}/pages/about.html">About Developer</a>
          <a href="${prefix}/pages/contact.html">Contact Us</a>
          <a href="${prefix}/pages/faq.html">FAQ Accordion</a>
        </div>
        <div>
          <h4>Legal Terms</h4>
          <a href="${prefix}/pages/privacy.html">Privacy Policy</a>
          <a href="${prefix}/pages/terms.html">Terms & Conditions</a>
          <a href="${prefix}/pages/disclaimer.html">Disclaimer</a>
        </div>
      </div>
      <div class="copy">
        <p>&copy; ${new Date().getFullYear()} SSDK Tools Hub. All rights reserved. Created with 💖 by Swarnava Das.</p>
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML("beforeend", footerHTML);
}

function setupHeaderControls(core) {
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");
  if (burger && navLinks) {
    burger.onclick = () => {
      navLinks.classList.toggle("open");
    };
  }

  // Bind theme engine toggle trigger
  const themeBtn = document.getElementById("themeBtn");
  const themeEngine = core.getEngine("theme");
  if (themeBtn && themeEngine) {
    themeBtn.textContent = themeEngine.currentTheme === "dark" ? "☀️ Light" : "🌙 Dark";
    themeBtn.onclick = () => themeEngine.toggleTheme();
  }

  // Expand category dropdown elements on touch clicks (mobile <= 900px)
  setTimeout(() => {
    const trigger = document.querySelector(".dropdown-trigger");
    if (trigger) {
      trigger.onclick = (e) => {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          e.stopPropagation();
          trigger.parentElement.classList.toggle("open");
        }
      };
    }
  }, 100);

  // Multilingual init for landing
  const langSelect = document.getElementById("langSelect");
  if (langSelect) {
    const savedLang = localStorage.getItem("ssdk-lang") || "en";
    langSelect.value = savedLang;
    langSelect.onchange = () => {
      const selected = langSelect.value;
      localStorage.setItem("ssdk-lang", selected);
      if (window.ssdkTranslate) {
        window.ssdkTranslate(selected);
      }
      window.dispatchEvent(new CustomEvent("ssdk-lang-change", { detail: selected }));
    };
    setTimeout(() => {
      if (window.ssdkTranslate) {
        window.ssdkTranslate(savedLang);
      }
    }, 150);
  }

  // Set favorites count badge in header
  if (window.updateFavoritesBadge) {
    window.updateFavoritesBadge();
  } else {
    const updateFavs = () => {
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
    };
    updateFavs();
    window.updateFavoritesBadge = updateFavs;
  }
}

// Global Translations Dictionary for index.html
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
    sortLabel: "Sort:",
    suggestTitle: "Suggestions",
    popularTitle: "Popular Searches",
    recentTitle: "Recent Searches",
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
    sortLabel: "সর্ট:",
    suggestTitle: "পরামর্শ",
    popularTitle: "জনপ্রিয় অনুসন্ধান",
    recentTitle: "সাম্প্রতিক অনুসন্ধান",
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
    sortLabel: "क्रमबद्ध करें:",
    suggestTitle: "सुझाव",
    popularTitle: "लोकप्रिय खोजें",
    recentTitle: "हाल की खोजें",
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
  const langDict = window.ssdkTranslations[lang] || window.ssdkTranslations["en"];
  
  document.querySelectorAll("[data-translate]").forEach(el => {
    const key = el.getAttribute("data-translate");
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
    searchInput.placeholder = langDict.searchPlaceholder;
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
    if (contactLink) contactLink.textContent = lang === "bn" ? "যোগাযোগ" : (lang === "hi" ? "संपर्क" : "Contact");
  }

  // Dynamically rebuild category dropdown with translated text
  const dropCats = document.getElementById("dropCats");
  const categories = window.ssdkHeaderCategories;
  const prefix = window.ssdkHeaderPrefix || ".";
  if (dropCats && categories) {
    dropCats.innerHTML = "";
    categories.forEach(cat => {
      const a = document.createElement("a");
      a.href = `${prefix}/index.html#tools`;
      const catName = typeof cat === "string" ? cat : cat.name;
      const catEmoji = typeof cat === "string" ? "" : (cat.emoji || "");
      const translatedName = window.ssdkTranslateKey ? window.ssdkTranslateKey(catName) : catName;
      a.textContent = catEmoji ? `${catEmoji} ${translatedName}` : translatedName;
      a.onclick = (e) => {
        e.preventDefault();
        
        // Hide mobile burger drawer if open
        const navLinks = document.getElementById("navLinks");
        if (navLinks) navLinks.classList.remove("open");
        
        const onLanding = document.getElementById("toolContainer") !== null;
        if (onLanding) {
          const catBlocks = document.querySelectorAll(".cat-block");
          catBlocks.forEach(b => {
            const dataCat = b.getAttribute("data-cat") || "";
            const head = b.querySelector(".cat-head").textContent.toLowerCase();
            const searchCat = catName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const normHead = head.replace(/[^a-z0-9]/g, "");
            const normDataCat = dataCat.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (normHead.includes(searchCat) || normDataCat.includes(searchCat)) {
              if (!b.classList.contains("open")) {
                const catHead = b.querySelector(".cat-head");
                if (catHead) catHead.click();
              }
              b.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          });
        } else {
          sessionStorage.setItem("ssdk-open-category", catName);
          window.location.href = `${prefix}/index.html`;
        }
      };
      dropCats.appendChild(a);
    });
  }
};
