export interface PDFExtractionResult {
  success: boolean;
  text: string;
  pages: number;
  characters: number;
  meaningfulWords: number;
  meaningfulRatio: number;
  method: string;
  error?: string;
}

export class SimplePDFReader {
  static async extractText(file: File): Promise<PDFExtractionResult> {
    try {
      console.log(`📖 Reading PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const uint8Array = new Uint8Array(buffer);
      
      // Method 1: Try UTF-8 decoding
      let text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      // Method 2: Try Latin-1 if UTF-8 fails
      if (text.length < 100 || this.isMostlyGibberish(text)) {
        console.log('⚠️ UTF-8 failed, trying Latin-1...');
        text = new TextDecoder('latin1', { fatal: false }).decode(uint8Array);
      }
      
      // Method 3: Try UTF-16 if Latin-1 fails
      if (text.length < 100 || this.isMostlyGibberish(text)) {
        console.log('⚠️ Latin-1 failed, trying UTF-16...');
        text = new TextDecoder('utf-16', { fatal: false }).decode(uint8Array);
      }
      
      console.log(`📄 Raw text length: ${text.length} characters`);
      
      // Clean and extract readable text
      const cleanedText = this.extractReadableText(text);
      
      if (cleanedText.length < 20) {
        return {
          success: false,
          text: '',
          pages: 0,
          characters: 0,
          meaningfulWords: 0,
          meaningfulRatio: 0,
          method: 'failed',
          error: 'Could not extract readable text from PDF'
        };
      }
      
      const meaningfulWords = this.countMeaningfulWords(cleanedText);
      const meaningfulRatio = (meaningfulWords / cleanedText.split(/\s+/).length) * 100;
      
      console.log(`✅ Extracted: ${cleanedText.length} characters, ${meaningfulWords} meaningful words (${meaningfulRatio.toFixed(1)}%)`);
      
      return {
        success: true,
        text: cleanedText,
        pages: Math.max(1, Math.ceil(meaningfulWords / 250)),
        characters: cleanedText.length,
        meaningfulWords: meaningfulWords,
        meaningfulRatio: meaningfulRatio,
        method: 'simple-extraction'
      };
      
    } catch (error) {
      console.error('PDF extraction error:', error);
      return {
        success: false,
        text: '',
        pages: 0,
        characters: 0,
        meaningfulWords: 0,
        meaningfulRatio: 0,
        method: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private static isMostlyGibberish(text: string): boolean {
    const words = text.split(/\s+/);
    const meaningfulWords = words.filter(word => {
      const letterCount = (word.match(/[a-zA-Z]/g) || []).length;
      const totalLength = word.length;
      return totalLength >= 2 && 
             totalLength <= 20 && 
             letterCount >= totalLength * 0.6 &&
             !/^\d+$/.test(word) &&
             !/^[^a-zA-Z]*$/.test(word);
    });
    
    const ratio = (meaningfulWords.length / words.length) * 100;
    return ratio < 10; // Less than 10% meaningful words
  }
  
  private static extractReadableText(text: string): string {
    // Remove PDF artifacts and non-printable characters
    let cleaned = text
      .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract text between parentheses (common in PDFs)
    const parentheticalText = cleaned.match(/\(([^)]+)\)/g);
    if (parentheticalText) {
      const extracted = parentheticalText
        .map(match => match.slice(1, -1)) // Remove parentheses
        .join(' ')
        .trim();
      
      if (extracted.length > 50) {
        console.log('✅ Found parenthetical text, using it');
        return extracted;
      }
    }
    
    // Extract text after common PDF operators
    const operators = ['Tj', 'TJ', 'Tm', 'Td', 'TD'];
    let extractedText = '';
    
    for (const op of operators) {
      const regex = new RegExp(`\\(([^)]+)\\)\\s*${op}`, 'gi');
      const matches = cleaned.match(regex);
      if (matches) {
        const text = matches
          .map(match => match.replace(new RegExp(`\\s*${op}$`, 'i'), ''))
          .map(match => match.slice(1, -1)) // Remove parentheses
          .join(' ')
          .trim();
        
        if (text.length > extractedText.length) {
          extractedText = text;
        }
      }
    }
    
    if (extractedText.length > 50) {
      console.log('✅ Found operator-based text, using it');
      return extractedText;
    }
    
    // Fallback: extract sentences that look like script content
    const sentences = cleaned.split(/[.!?]+/);
    const scriptSentences = sentences.filter(sentence => {
      const trimmed = sentence.trim();
      return trimmed.length > 10 && 
             trimmed.length < 200 &&
             /[a-zA-Z]/.test(trimmed) &&
             !/^[0-9\s]+$/.test(trimmed);
    });
    
    if (scriptSentences.length > 0) {
      console.log('✅ Found sentence-based text, using it');
      return scriptSentences.join('. ').trim();
    }
    
    // Last resort: return cleaned text if it's reasonable
    if (cleaned.length > 50 && !this.isMostlyGibberish(cleaned)) {
      console.log('✅ Using cleaned text as fallback');
      return cleaned;
    }
    
    return '';
  }
  
  private static countMeaningfulWords(text: string): number {
    const words = text.split(/\s+/);
    const meaningfulWords = words.filter(word => {
      const letterCount = (word.match(/[a-zA-Z]/g) || []).length;
      const totalLength = word.length;
      
      return totalLength >= 2 && 
             totalLength <= 20 && 
             letterCount >= totalLength * 0.6 &&
             !/^\d+$/.test(word) &&
             !/^[^a-zA-Z]*$/.test(word);
    });
    
    return meaningfulWords.length;
  }
}
