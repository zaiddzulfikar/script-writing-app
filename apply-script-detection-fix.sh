#!/bin/bash

# Script untuk menerapkan perbaikan deteksi script request
# Menambahkan enhanced long script detection ke ChatInterface.tsx

echo "Menerapkan perbaikan deteksi script request..."

# Backup file asli
cp components/ChatInterface.tsx components/ChatInterface.tsx.backup

# Tambahkan enhanced detection setelah line 183
sed -i '' '183a\
    \
    // Enhanced long script detection\
    const isLongScriptRequest = (\
      (lowerMessage.includes('\''generate'\'') || \
       lowerMessage.includes('\''buat'\'') || \
       lowerMessage.includes('\''tulis'\'') ||\
       lowerMessage.includes('\''buatkan'\'') ||\
       lowerMessage.includes('\''tuliskan'\'')) &&\
      (lowerMessage.includes('\''halaman'\'') || \
       lowerMessage.includes('\''80'\'') || \
       lowerMessage.includes('\''90'\'') || \
       lowerMessage.includes('\''100'\'') ||\
       lowerMessage.includes('\''120'\'') ||\
       lowerMessage.includes('\''panjang'\'') ||\
       lowerMessage.includes('\''full'\'') ||\
       lowerMessage.includes('\''lengkap'\'') ||\
       lowerMessage.includes('\''episode'\''))\
    );\
\
    if (isLongScriptRequest) {\
      return true;\
    }\
\
    // Enhanced context-aware detection for script requests\
    const hasScriptContext = (\
      lowerMessage.includes('\''konflik'\'') ||\
      lowerMessage.includes('\''hook'\'') ||\
      lowerMessage.includes('\''karakter'\'') ||\
      lowerMessage.includes('\''cerita'\'') ||\
      lowerMessage.includes('\''plot'\'') ||\
      lowerMessage.includes('\''scene'\'') ||\
      lowerMessage.includes('\''dialog'\'') ||\
      lowerMessage.includes('\''adegan'\'')\
    );\
\
    const hasGenerationIntent = (\
      lowerMessage.includes('\''generate'\'') || \
      lowerMessage.includes('\''buat'\'') || \
      lowerMessage.includes('\''tulis'\'') ||\
      lowerMessage.includes('\''buatkan'\'') ||\
      lowerMessage.includes('\''tuliskan'\'')\
    );\
\
    if (hasGenerationIntent && hasScriptContext) {\
      return true;\
    }' components/ChatInterface.tsx

echo "Perbaikan berhasil diterapkan!"
echo "File backup tersimpan di: components/ChatInterface.tsx.backup"
