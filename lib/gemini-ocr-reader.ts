import { GoogleGenerativeAI } from "@google/generative-ai";

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

export class GeminiOCRReader {
  private static genAI: GoogleGenerativeAI | null = null;
  private static quotaExceeded = false;
  private static lastQuotaCheck = 0;

  private static initializeGemini() {
    if (!this.genAI) {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
      }
    }
    return this.genAI;
  }

  private static shouldUseGemini(): boolean {
    // Check if quota was exceeded recently (within last hour)
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (this.quotaExceeded && (now - this.lastQuotaCheck) < oneHour) {
      console.log('⚠️ Gemini quota exceeded recently, using fallback extraction');
      return false;
    }
    
    return true;
  }

  static async extractText(file: File): Promise<PDFExtractionResult> {
    // Check if we should use Gemini or fallback
    if (!this.shouldUseGemini()) {
      return this.fallbackExtraction(file);
    }

    try {
      console.log(`📖 Reading PDF with Gemini OCR: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      
      const genAI = this.initializeGemini();
      if (!genAI) {
        console.log('⚠️ Gemini API key not found, using fallback extraction');
        return this.fallbackExtraction(file);
      }

      // Convert PDF to base64 (browser-safe, no Buffer usage)
      const arrayBuffer = await file.arrayBuffer();
      const base64 = GeminiOCRReader.arrayBufferToBase64(arrayBuffer);
      
      // Use Gemini 1.5 Flash with vision capabilities
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        }
      });

      const prompt = `Extract all text from this PDF document. Return ONLY the extracted text content, preserving the original formatting and structure. Do not add any explanations or comments. If this is a script or screenplay, maintain the original script format with scene headings, character names, and dialogue.

PDF Content:`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: "application/pdf"
          }
        }
      ]);

      const extractedText = result.response.text().trim();
      
      if (extractedText.length < 20) {
        return {
          success: false,
          text: '',
          pages: 0,
          characters: 0,
          meaningfulWords: 0,
          meaningfulRatio: 0,
          method: 'gemini-ocr-failed',
          error: 'Gemini OCR could not extract meaningful text from PDF'
        };
      }

      const meaningfulWords = this.countMeaningfulWords(extractedText);
      const meaningfulRatio = (meaningfulWords / extractedText.split(/\s+/).length) * 100;
      
      console.log(`✅ Gemini OCR success: ${extractedText.length} characters, ${meaningfulWords} meaningful words (${meaningfulRatio.toFixed(1)}%)`);
      
      return {
        success: true,
        text: extractedText,
        pages: Math.max(1, Math.ceil(meaningfulWords / 250)), // Rough estimate
        characters: extractedText.length,
        meaningfulWords: meaningfulWords,
        meaningfulRatio: meaningfulRatio,
        method: 'gemini-ocr'
      };
      
    } catch (error) {
      console.error('Gemini OCR extraction error:', error);
      
      // Check if it's a quota error
      if (error instanceof Error && error.message.includes('429')) {
        console.log('⚠️ Gemini API quota exceeded, using fallback extraction...');
        this.quotaExceeded = true;
        this.lastQuotaCheck = Date.now();
      } else {
        console.log('⚠️ Gemini OCR failed, trying simple extraction...');
      }
      
      return this.fallbackExtraction(file);
    }
  }

  private static async fallbackExtraction(file: File): Promise<PDFExtractionResult> {
    try {
      const uint8Array = new Uint8Array(await file.arrayBuffer());
      
      // Try different encodings
      let text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      
      if (text.length < 100 || this.isMostlyGibberish(text)) {
        text = new TextDecoder('latin1', { fatal: false }).decode(uint8Array);
      }
      
      if (text.length < 100 || this.isMostlyGibberish(text)) {
        text = new TextDecoder('utf-16', { fatal: false }).decode(uint8Array);
      }
      
      // Extract readable text
      const cleanedText = this.extractReadableText(text);
      
      if (cleanedText.length < 20) {
        return {
          success: false,
          text: '',
          pages: 0,
          characters: 0,
          meaningfulWords: 0,
          meaningfulRatio: 0,
          method: 'fallback-failed',
          error: 'Could not extract meaningful text using fallback methods'
        };
      }
      
      const meaningfulWords = this.countMeaningfulWords(cleanedText);
      const meaningfulRatio = (meaningfulWords / cleanedText.split(/\s+/).length) * 100;
      
      console.log(`⚠️ Fallback extraction: ${cleanedText.length} characters, ${meaningfulWords} meaningful words (${meaningfulRatio.toFixed(1)}%)`);
      
      return {
        success: true,
        text: cleanedText,
        pages: Math.max(1, Math.ceil(meaningfulWords / 250)),
        characters: cleanedText.length,
        meaningfulWords: meaningfulWords,
        meaningfulRatio: meaningfulRatio,
        method: 'fallback-extraction'
      };
      
    } catch (error) {
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

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // btoa is available in browsers
    return typeof btoa !== 'undefined' ? btoa(binary) : '';
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
    return ratio < 10;
  }
  
  private static extractReadableText(text: string): string {
    // Remove PDF artifacts and non-printable characters
    let cleaned = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract text between parentheses (common in PDFs)
    const parentheticalText = cleaned.match(/\(([^)]+)\)/g);
    if (parentheticalText) {
      const extracted = parentheticalText
        .map(match => match.slice(1, -1))
        .join(' ')
        .trim();
      
      if (extracted.length > 50) {
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
          .map(match => match.slice(1, -1))
          .join(' ')
          .trim();
        
        if (text.length > extractedText.length) {
          extractedText = text;
        }
      }
    }
    
    if (extractedText.length > 50) {
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
      return scriptSentences.join('. ').trim();
    }
    
    // Last resort: return cleaned text if it's reasonable
    if (cleaned.length > 50 && !this.isMostlyGibberish(cleaned)) {
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
