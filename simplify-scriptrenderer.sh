#!/bin/bash

# Script untuk menyederhanakan ScriptRenderer
echo "Menyederhanakan ScriptRenderer..."

# Backup file asli
cp components/ScriptRenderer.tsx components/ScriptRenderer.tsx.backup

# Ganti scene headings detection (tidak perlu handle **bold** format lagi)
sed -i '' 's|if (line.match(/^(\*\*)?(INT\.|EXT\.|INT\/EXT\.|INT-EXT\.)/)) {|if (line.match(/^(INT\.|EXT\.|INT\/EXT\.|INT-EXT\.)/)) {|' components/ScriptRenderer.tsx

# Hapus line yang membersihkan ** formatting
sed -i '' 's|const cleanLine = line.replace(/\*\*/g, '\'''\'');||' components/ScriptRenderer.tsx
sed -i '' 's|{cleanLine}|{line}|' components/ScriptRenderer.tsx

# Ganti character names detection juga
sed -i '' 's|else if (line.match(/^(\*\*)?[A-Z\s]+(\*\*)?$/) && !line.includes('\''('\'') && !line.includes('\'')'\'') &&|else if (line.match(/^[A-Z\s]+$/) && !line.includes('\''('\'') && !line.includes('\'')'\'') &&|' components/ScriptRenderer.tsx

# Hapus line yang membersihkan ** formatting untuk character names
sed -i '' 's|const cleanLine = line.replace(/\*\*/g, '\'''\'');||' components/ScriptRenderer.tsx
sed -i '' 's|{cleanLine}|{line}|' components/ScriptRenderer.tsx

echo "ScriptRenderer berhasil disederhanakan!"
echo "File backup tersimpan di: components/ScriptRenderer.tsx.backup"
