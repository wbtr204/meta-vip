const fs = require('fs');
const path = 'backend/controllers/post.controller.js';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Keep 1-205 (Array is 0-indexed, so 0-204)
// Fixing line 206 (index 205) which is "};g from ..."
const part1 = lines.slice(0, 205);
part1.push('};'); // Fix the closing brace

// The unique content continues from line 394 (index 393) "export const deleteComment ..."
const part2 = lines.slice(393);

// Join them
const newContent = part1.join('\n') + '\n\n' + part2.join('\n');

fs.writeFileSync(path, newContent);
console.log("Basic repair done.");
