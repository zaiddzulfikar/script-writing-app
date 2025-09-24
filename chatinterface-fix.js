// Implementasi perbaikan untuk ChatInterface.tsx
// Ganti fungsi isScriptWritingRequest dengan implementasi ini

// Tambahkan setelah line 183 (setelah pengecekan strongScriptKeywords)

    // Enhanced long script detection
    const isLongScriptRequest = (
      (lowerMessage.includes('generate') || 
       lowerMessage.includes('buat') || 
       lowerMessage.includes('tulis') ||
       lowerMessage.includes('buatkan') ||
       lowerMessage.includes('tuliskan')) &&
      (lowerMessage.includes('halaman') || 
       lowerMessage.includes('80') || 
       lowerMessage.includes('90') || 
       lowerMessage.includes('100') ||
       lowerMessage.includes('120') ||
       lowerMessage.includes('panjang') ||
       lowerMessage.includes('full') ||
       lowerMessage.includes('lengkap') ||
       lowerMessage.includes('episode'))
    );

    if (isLongScriptRequest) {
      return true;
    }

    // Enhanced context-aware detection for script requests
    const hasScriptContext = (
      lowerMessage.includes('konflik') ||
      lowerMessage.includes('hook') ||
      lowerMessage.includes('karakter') ||
      lowerMessage.includes('cerita') ||
      lowerMessage.includes('plot') ||
      lowerMessage.includes('scene') ||
      lowerMessage.includes('dialog') ||
      lowerMessage.includes('adegan')
    );

    const hasGenerationIntent = (
      lowerMessage.includes('generate') || 
      lowerMessage.includes('buat') || 
      lowerMessage.includes('tulis') ||
      lowerMessage.includes('buatkan') ||
      lowerMessage.includes('tuliskan')
    );

    if (hasGenerationIntent && hasScriptContext) {
      return true;
    }
