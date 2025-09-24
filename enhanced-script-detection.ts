// Enhanced script detection function untuk ChatInterface.tsx
// Ganti fungsi isScriptWritingRequest dengan implementasi ini

const isScriptWritingRequest = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  
  // Strong scriptwriting indicators (must be present)
  const strongScriptKeywords = [
    'buatkan script', 'buat script', 'tulis script', 'generate script',
    'buatkan naskah', 'buat naskah', 'tulis naskah', 'generate naskah',
    'buatkan episode', 'buat episode', 'tulis episode', 'generate episode',
    'buatkan scene', 'buat scene', 'tulis scene', 'generate scene',
    'buatkan adegan', 'buat adegan', 'tulis adegan', 'generate adegan',
    'buatkan dialog', 'buat dialog', 'tulis dialog', 'generate dialog',
    'screenplay', 'format script', 'script format', 'naskah format',
    'lanjutkan cerita', 'lanjutkan script', 'lanjutkan naskah', 'lanjutkan episode',
    'lanjut cerita', 'lanjut script', 'lanjut naskah', 'lanjut episode',
    'lanjutkan', 'lanjut', 'continue', 'melanjutkan', 'teruskan',
    'opening scene', 'scene pembuka', 'adegan pembuka', 'scene pertama',
    'scene awal', 'scene opening', 'pembuka episode', 'awal episode',
    'scene kuat', 'scene menarik', 'scene engaging', 'scene dramatis'
  ];
  
  // Check for strong indicators first
  if (strongScriptKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
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
  
  // Medium scriptwriting indicators (need context)
  const mediumScriptKeywords = [
    'scene heading', 'slugline', 'action line', 'parenthetical',
    'montage', 'voice over', 'narasi', 'monolog', 'o.s.', 'v.o.',
    'cont\'d', 'beat', 'super:', 'cut to:', 'dissolve to:',
    '3-act structure', 'character arc', 'story arc', 'climax', 'resolution'
  ];
  
  // Check for medium indicators with context
  if (mediumScriptKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  // Weak indicators (need multiple or specific context)
  const weakScriptKeywords = [
    'karakter', 'plot', 'cerita', 'struktur', 'setup', 'confrontation',
    'dialogue', 'production', 'director', 'actor', 'crew', 'shooting'
  ];
  
  // Only trigger if multiple weak indicators or specific context
  const weakMatches = weakScriptKeywords.filter(keyword => lowerMessage.includes(keyword));
  if (weakMatches.length >= 2) {
    return true;
  }
  
  // Check for specific scriptwriting phrases
  const scriptPhrases = [
    'bagaimana cara menulis', 'cara membuat script', 'cara menulis naskah',
    'format penulisan script', 'struktur script', 'elemen script',
    'tutorial script', 'panduan script', 'tips script'
  ];
  
  if (scriptPhrases.some(phrase => lowerMessage.includes(phrase))) {
    return true;
  }
  
  return false;
};
