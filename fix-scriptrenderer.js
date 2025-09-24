// Script untuk menyederhanakan ScriptRenderer
const fs = require('fs');

// Baca file ScriptRenderer
let content = fs.readFileSync('components/ScriptRenderer.tsx', 'utf8');

// Ganti scene headings detection
content = content.replace(
  /if \(line\.match\(\/^\(\\\*\\\*\)\?\(INT\.\|EXT\.\|INT\\\/EXT\.\|INT-EXT\.\)\/\)\) \{/g,
  "if (line.match(/^(INT\\.|EXT\\.|INT\\/EXT\\.|INT-EXT\\.)/)) {"
);

// Hapus line yang membersihkan ** formatting
content = content.replace(
  /const cleanLine = line\.replace\(\/\\\*\\\*\/g, ''\);/g,
  ""
);

// Ganti {cleanLine} dengan {line}
content = content.replace(/\{cleanLine\}/g, "{line}");

// Ganti character names detection
content = content.replace(
  /else if \(line\.match\(\/^\(\\\*\\\*\)\?\[A-Z\\s\]\+\(\\\*\\\*\)\?\$\/\) && !line\.includes\('\('\) && !line\.includes\('\)'\) &&/g,
  "else if (line.match(/^[A-Z\\s]+$/) && !line.includes('(') && !line.includes(')') &&"
);

// Hapus line yang membersihkan ** formatting untuk character names
content = content.replace(
  /const cleanLine = line\.replace\(\/\\\*\\\*\/g, ''\);/g,
  ""
);

// Ganti {cleanLine} dengan {line} untuk character names
content = content.replace(/\{cleanLine\}/g, "{line}");

// Tulis file yang sudah diperbaiki
fs.writeFileSync('components/ScriptRenderer.tsx', content);

console.log('ScriptRenderer berhasil disederhanakan!');
