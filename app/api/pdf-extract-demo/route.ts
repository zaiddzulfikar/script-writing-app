import { NextRequest, NextResponse } from "next/server";
import { GeminiOCRReader } from '@/lib/gemini-ocr-reader';

export const runtime = "nodejs";

// Simple PDF text extraction using pattern-based approach
function extractTextFromPDF(buffer: Buffer): string {
  const uint8Array = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  
  // Extract meaningful content using regex patterns
  const patterns = [
    /(INT\.|EXT\.)[^.]*\./gi,        // Scene headings
    /[A-Z][A-Z\s]+[:\(]/g,           // Character names
    /\([^)]+\)/g,                    // Parentheticals
    /(CUT\s+TO|FADE\s+(IN|OUT)|DISSOLVE\s+TO)/gi,  // Transitions
    /[A-Z][a-z\s]+[.!?]/g,           // Action lines
    /\b(SCENE|ACT|EPISODE|CHARACTER|DIALOGUE|ACTION|NARRATOR)\b/gi  // Common script words
  ];
  
  let extractedText = '';
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      extractedText += matches.join(' ') + ' ';
    }
  }
  
  // If we found patterns, return them
  if (extractedText.length > 50) {
    return extractedText.trim();
  }
  
  // Otherwise, try to extract readable text
  const readableText = text
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Keep only common punctuation
    .trim();
  
  // Return first 5000 characters if it looks readable
  if (readableText.length > 100) {
    return readableText.substring(0, 5000);
  }
  
  return '';
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 PDF Extract Demo API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const userId = formData.get('userId') as string;
    
    console.log('📄 File received:', file?.name, file?.size);
    console.log('📋 Project ID:', projectId);
    console.log('👤 User ID:', userId);
    
    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: 'No file provided' 
      }, { status: 400 });
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        success: false,
        error: 'Only PDF files are allowed' 
      }, { status: 400 });
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ 
        success: false,
        error: 'File size too large (max 10MB)' 
      }, { status: 400 });
    }
    
    // Use Gemini OCR reader
    const extractionResult = await GeminiOCRReader.extractText(file);
    
    console.log('📝 Extracted text length:', extractionResult.text.length);
    console.log('📝 Text preview:', extractionResult.text.substring(0, 200));
    console.log('📊 Meaningful ratio:', extractionResult.meaningfulRatio.toFixed(1) + '%');
    console.log('🔧 Extraction method:', extractionResult.method);
    
    if (!extractionResult.success) {
      return NextResponse.json({ 
        success: false,
        error: extractionResult.error || 'Could not extract meaningful text from PDF' 
      }, { status: 422 });
    }
    
    const extractedText = extractionResult.text;
    
    // Return extracted text without saving to database
    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      textLength: extractedText.length,
      pages: extractionResult.pages,
      meaningfulWords: extractionResult.meaningfulWords,
      meaningfulRatio: extractionResult.meaningfulRatio,
      extractionMethod: extractionResult.method,
      extractedText: extractedText,
      preview: extractedText.substring(0, 200) + '...',
      message: 'PDF text extracted successfully (demo mode)'
    });
    
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
