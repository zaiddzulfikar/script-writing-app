import { NextRequest } from "next/server";

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

export class EnhancedPDFReader {
  private static readonly SCRIPT_PATTERNS = [
    // Scene headings
    /(INT\.|EXT\.|INTERIOR|EXTERIOR)[^.]*\./gi,
    // Character names (all caps followed by colon or parenthesis)
    /[A-Z][A-Z\s]{2,}[:\(]/g,
    // Parenthetical directions
    /\([^)]+\)/g,
    // Transitions
    /(CUT\s+TO|FADE\s+(IN|OUT)|DISSOLVE\s+TO|SMASH\s+CUT|MATCH\s+CUT)/gi,
    // Action lines (sentences starting with capital letters)
    /[A-Z][a-z\s]+[.!?]/g,
    // Dialog patterns
    /"[^"]*"/g,
    // Time indicators
    /(MORNING|AFTERNOON|EVENING|NIGHT|DAWN|DUSK)/gi,
    // Location indicators
    /(AT|IN|ON)\s+[A-Z][a-z\s]+/gi
  ];

  private static readonly CLEANUP_PATTERNS = [
    // Remove PDF artifacts
    /[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/g,
    // Remove excessive whitespace
    /\s+/g,
    // Remove page numbers and headers
    /^\d+\s*$/gm,
    // Remove PDF metadata
    /^[A-Za-z\s]*PDF[A-Za-z\s]*$/gm,
    // Remove font specifications
    /[A-Za-z]+\/[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+/g
  ];

  static async extractText(file: File): Promise<PDFExtractionResult> {
    try {
      console.log(`📖 Reading PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const uint8Array = new Uint8Array(buffer);
      
      // Method 1: Try direct text extraction
      let rawText = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      // Method 2: Try with different encodings if first fails
      if (rawText.length < 100) {
        try {
          rawText = new TextDecoder('latin1', { fatal: false }).decode(uint8Array);
        } catch (e) {
          console.log('⚠️ Latin1 decoding failed, trying UTF-16');
          rawText = new TextDecoder('utf-16', { fatal: false }).decode(uint8Array);
        }
      }

      console.log(`📄 Raw text length: ${rawText.length} characters`);
      
      // Clean up the text
      let cleanedText = this.cleanText(rawText);
      
      // If cleaned text is still mostly gibberish, try pattern extraction
      const meaningfulWords = this.countMeaningfulWords(cleanedText);
      const meaningfulRatio = (meaningfulWords / cleanedText.split(/\s+/).length) * 100;
      
      console.log(`📊 Text analysis: ${meaningfulWords} meaningful words, ratio: ${meaningfulRatio.toFixed(1)}%`);
      
      if (meaningfulRatio < 10) {
        console.log('⚠️ Text appears to be mostly gibberish, trying pattern extraction...');
        const extractedText = this.extractScriptPatterns(rawText);
        if (extractedText.length > cleanedText.length) {
          cleanedText = extractedText;
          console.log(`✅ Extracted ${cleanedText.length} characters of script patterns`);
        }
      }

      // Final cleanup
      cleanedText = this.finalCleanup(cleanedText);
      
      console.log(`🧹 Cleaned text length: ${cleanedText.length} characters`);
      
      if (cleanedText.length < 20) {
        return {
          success: false,
          text: '',
          pages: 0,
          characters: 0,
          meaningfulWords: 0,
          meaningfulRatio: 0,
          method: 'failed',
          error: 'Failed to extract meaningful text from PDF'
        };
      }

      return {
        success: true,
        text: cleanedText,
        pages: this.estimatePages(cleanedText),
        characters: cleanedText.length,
        meaningfulWords: this.countMeaningfulWords(cleanedText),
        meaningfulRatio: (this.countMeaningfulWords(cleanedText) / cleanedText.split(/\s+/).length) * 100,
        method: meaningfulRatio < 10 ? 'pattern-extraction' : 'direct-extraction'
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

  private static cleanText(text: string): string {
    let cleaned = text;
    
    // Apply cleanup patterns
    for (const pattern of this.CLEANUP_PATTERNS) {
      cleaned = cleaned.replace(pattern, ' ');
    }
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  private static extractScriptPatterns(text: string): string {
    let extracted = '';
    
    for (const pattern of this.SCRIPT_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        extracted += matches.join(' ') + ' ';
      }
    }
    
    return extracted.trim();
  }

  private static finalCleanup(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/g, '')
      .trim();
  }

  private static countMeaningfulWords(text: string): number {
    const words = text.split(/\s+/);
    const meaningfulWords = words.filter(word => {
      // Check if word contains mostly letters and is reasonable length
      const letterCount = (word.match(/[a-zA-Z]/g) || []).length;
      const totalLength = word.length;
      
      return totalLength >= 2 && 
             totalLength <= 20 && 
             letterCount >= totalLength * 0.6 &&
             !/^\d+$/.test(word) && // Not just numbers
             !/^[^a-zA-Z]*$/.test(word); // Contains at least one letter
    });
    
    return meaningfulWords.length;
  }

  private static estimatePages(text: string): number {
    // Rough estimate: 250 words per page for scripts
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 250));
  }
}
