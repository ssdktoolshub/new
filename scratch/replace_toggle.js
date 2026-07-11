const fs = require('fs');

const file = 'c:\\Users\\USER\\Desktop\\update\\engines\\homepage-engine.js';
let content = fs.readFileSync(file, 'utf8');

const replacement = `const head = block.querySelector(".cat-head");
        const body = block.querySelector(".cat-body");

        head.onclick = () => {
            const isOpen = block.classList.contains("open");

            // অন্য সব category বন্ধ করো (optional)
            document.querySelectorAll(".cat-block").forEach(item => {
                item.classList.remove("open");
            });

            if (!isOpen) {
                block.classList.add("open");

                requestAnimationFrame(() => {
                    block.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                });
            }
        };`;

// Replace first occurrence (around line 148)
content = content.replace(
    /const head = block\.querySelector\("\.cat-head"\);\s*head\.onclick = \(\) => \{ block\.classList\.toggle\("open"\); \};/g,
    replacement
);

// Replace second occurrence (around line 216)
content = content.replace(
    /const head = block\.querySelector\("\.cat-head"\);\s*const body = block\.querySelector\("\.cat-body"\);\s*head\.onclick = \(\) => \{ block\.classList\.toggle\("open"\); \};/g,
    replacement
);

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced successfully');
