// SSDK Documentation Generator script
// Scans the engines/ and core/ folders and generates architectural markdown files inside docs/

import fs from 'fs';
import path from 'path';

const enginesDir = './engines';
const coreDir = './core';
const docsOutputFile = './docs/engine_reference.md';

function generateDocumentation() {
  console.log("[DocGen] Scanning system directories...");
  let docContent = `# SSDK Platform Engine Documentation

This reference guide is automatically compiled by the SSDK Documentation Generator. It provides description, exported class signatures, and responsibilities for all Core Orchestration and Feature engines.

---

`;

  // Parse Core Dir
  docContent += `## 1. Core Modules\n\n`;
  if (fs.existsSync(coreDir)) {
    const files = fs.readdirSync(coreDir).filter(f => f.endsWith(".js"));
    files.forEach(file => {
      const filePath = path.join(coreDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      docContent += compileFileDoc(file, content);
    });
  }

  // Parse Engines Dir
  docContent += `## 2. Feature Engines\n\n`;
  if (fs.existsSync(enginesDir)) {
    const files = fs.readdirSync(enginesDir).filter(f => f.endsWith(".js"));
    files.forEach(file => {
      const filePath = path.join(enginesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      docContent += compileFileDoc(file, content);
    });
  }

  // Ensure docs directory exists
  if (!fs.existsSync('./docs')) {
    fs.mkdirSync('./docs');
  }

  fs.writeFileSync(docsOutputFile, docContent, 'utf-8');
  console.log(`[DocGen] Documentation successfully written to: ${docsOutputFile}`);
}

function compileFileDoc(filename, code) {
  let doc = `### File: \`${filename}\`\n\n`;

  // Try to find module level comments at the top (first line starting with //)
  const firstLine = code.split("\n")[0];
  const description = firstLine.startsWith("//") ? firstLine.replace("//", "").trim() : "No descriptive summary provided.";
  
  doc += `* **Purpose**: ${description}\n`;

  // Search for classes
  const classMatches = code.match(/export\s+class\s+(\w+)/g);
  if (classMatches) {
    const classNames = classMatches.map(m => m.replace(/export\s+class\s+/, "").trim());
    doc += `* **Exported Classes**: ${classNames.join(", ")}\n`;
  }

  // Search for functions inside class definition
  const methodRegex = /^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm;
  const methods = [];
  let match;
  while ((match = methodRegex.exec(code)) !== null) {
    const methodName = match[2];
    // Exclude common constructor and standard built-ins
    if (methodName !== "constructor" && methodName !== "if" && methodName !== "for" && methodName !== "switch") {
      methods.push(`\`${methodName}()\``);
    }
  }

  if (methods.length > 0) {
    doc += `* **Key Methods**: ${methods.join(", ")}\n`;
  }

  doc += `\n---\n\n`;
  return doc;
}

generateDocumentation();
