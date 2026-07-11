import fs from 'fs';
import { HomepageEngine } from '../engines/homepage-engine.js';

// Mock DOM
global.document = {
    readyState: "complete",
    getElementById: (id) => {
        if (id === "toolContainer") return { innerHTML: "", appendChild: () => {} };
        if (id === "sortSelect") return { value: "alphabetical" };
        if (id === "noResult") return { style: {} };
        return null;
    },
    createElement: (tag) => {
        return {
            className: "",
            setAttribute: () => {},
            querySelector: () => ({ textContent: "", onclick: null }),
            querySelectorAll: () => [],
            classList: { toggle: () => {}, add: () => {}, remove: () => {} }
        };
    }
};
global.window = {
    localStorage: { getItem: () => "en" },
    ssdkTranslations: { en: {} },
    ssdkTranslate: () => {}
};

// Mock Core
const core = {
    prefix: ".",
    getEngine: (name) => {
        if (name === "config") {
            return {
                getCategories: async () => JSON.parse(fs.readFileSync('../assets/json/categories.json', 'utf8')),
                getTools: async () => JSON.parse(fs.readFileSync('../assets/json/tools.json', 'utf8'))
            };
        }
        if (name === "favorites") {
            return { isFavorite: () => false };
        }
        if (name === "search") {
            return { search: async () => [] };
        }
        return null;
    }
};

const engine = new HomepageEngine();
engine.core = core;
engine.container = document.getElementById("toolContainer");

engine.render().then(() => {
    console.log("Render completed without crashing!");
}).catch(e => {
    console.error("CRASHED:", e);
});
