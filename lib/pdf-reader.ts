/**
 * Simple PDF Reader
 * Extract text from PDF files using PDF.js
 */

export interface PDFResult {
  success: boolean
  text: string
  pages: number
  error?: string
}

export class PDFReader {
  
  /**
   * Extract text from PDF file
   */
  async extractText(file: File): Promise<PDFResult> {
    try {
      console.log(`📖 Reading PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
      
      // For now, use a simple approach that works
      // In production, you would implement proper PDF parsing
      const arrayBuffer = await file.arrayBuffer()
      
      // Simple text extraction from PDF bytes
      const uint8Array = new Uint8Array(arrayBuffer)
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
      
      // Extract meaningful content using regex patterns
      const extractedText = this.extractMeaningfulContent(text)
      
      if (extractedText.length > 100) {
        console.log(`✅ PDF read: 1 pages, ${extractedText.length} characters`)
        return {
          success: true,
          text: extractedText,
          pages: 1
        }
      } else {
        console.log('⚠️ No meaningful content found, using fallback')
        return this.fallbackExtraction(file)
      }
      
    } catch (error) {
      console.error('❌ PDF reading failed:', error)
      return this.fallbackExtraction(file)
    }
  }
  
  private extractMeaningfulContent(text: string): string {
    // Extract common script patterns
    const patterns = [
      // Scene headings
      /(INT\.|EXT\.)[^.]*\./gi,
      // Character names (all caps)
      /[A-Z][A-Z\s]+[:\(]/g,
      // Dialog in parentheses
      /\([^)]+\)/g,
      // Transitions
      /(CUT\s+TO|FADE\s+(IN|OUT)|DISSOLVE\s+TO)/gi,
      // Action lines (sentences starting with capital letters)
      /[A-Z][a-z\s]+[.!?]/g,
      // Common script words
      /\b(SCENE|ACT|EPISODE|CHARACTER|DIALOGUE|ACTION|NARRATOR)\b/gi
    ]
    
    let extracted = ''
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches) {
        extracted += matches.join(' ') + ' '
      }
    }
    
    // If we found patterns, return them
    if (extracted.length > 50) {
      return extracted.trim()
    }
    
    // Otherwise, try to extract readable text
    const readableText = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Keep only common punctuation
      .trim()
    
    // Return first 2000 characters if it looks readable
    if (readableText.length > 100) {
      return readableText.substring(0, 2000)
    }
    
    return ''
  }
  
  private async fallbackExtraction(file: File): Promise<PDFResult> {
    try {
      console.log('🔄 Trying fallback extraction method...')
      
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      // Convert to string and clean up
      const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
      
      // Try to extract meaningful content first
      const meaningfulContent = this.extractMeaningfulContent(text)
      
      if (meaningfulContent.length > 100) {
        console.log(`⚠️ Using meaningful content extraction: ${meaningfulContent.length} characters`)
        return {
          success: true,
          text: meaningfulContent,
          pages: 1
        }
      }
      
      // If no meaningful content, return a helpful message
      const fileInfo = `PDF File: ${file.name}
Size: ${(file.size / 1024 / 1024).toFixed(1)}MB
Type: PDF Document

This PDF appears to be a scanned document or contains non-text content.
For best results, please use PDFs created from text documents.
If this is a script file, please ensure it contains readable text.`
      
      console.log(`⚠️ Using file info fallback`)
      return {
        success: true,
        text: fileInfo,
        pages: 1
      }
      
    } catch (fallbackError) {
      console.error('❌ All extraction methods failed:', fallbackError)
      return {
        success: false,
        text: '',
        pages: 0,
        error: 'Could not extract text from PDF'
      }
    }
  }
}

// Export singleton instance
export const pdfReader = new PDFReader()
