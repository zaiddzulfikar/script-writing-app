// Final fix untuk ScriptRenderer
const fs = require('fs');

// Baca file ScriptRenderer
let content = fs.readFileSync('components/ScriptRenderer.tsx', 'utf8');

// Ganti scene headings detection dengan yang sederhana
content = content.replace(
  /if \(line\.match\(\/^\(\\\*\\\*\)\?\(INT\.\|EXT\.\|INT\\\/EXT\.\|INT-EXT\.\)\/\)\) \{/g,
  "if (line.match(/^(INT\\.|EXT\\.|INT\\/EXT\\.|INT-EXT\\.)/)) {"
);

// Hapus comment yang tidak perlu
content = content.replace(
  /\/\/ Handle both plain format and \*\*bold\*\* format from backend/g,
  "// Scene headings detection"
);

// Hapus line yang membersihkan ** formatting
content = content.replace(
  /\/\/ Remove \*\* formatting for display since we apply our own bold styling/g,
  "// Apply bold styling with CSS"
);

// Tulis file yang sudah diperbaiki
fs.writeFileSync('components/ScriptRenderer.tsx', content);

console.log('ScriptRenderer final fix berhasil!');
