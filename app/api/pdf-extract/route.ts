import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, orderBy, doc, deleteDoc } from "firebase/firestore";
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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: 'Tidak ada file yang disediakan' 
      }, { status: 400 });
    }
    
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        success: false,
        error: 'Hanya file PDF yang diperbolehkan' 
      }, { status: 400 });
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ 
        success: false,
        error: 'Ukuran file terlalu besar (maksimal 10MB)' 
      }, { status: 400 });
    }
    
    // Extract text from PDF using Gemini OCR
    const extractionResult = await GeminiOCRReader.extractText(file);
    
    if (!extractionResult.success) {
      return NextResponse.json({ 
        success: false,
        error: extractionResult.error || 'Tidak dapat mengekstrak teks yang bermakna dari PDF' 
      }, { status: 422 });
    }
    
    const extractedText = extractionResult.text;
    
    // Save to Firestore
    const scriptData = {
      projectId,
      userId,
      fileName: file.name,
      fileSize: file.size,
      extractedText,
      textLength: extractedText.length,
      pages: extractionResult.pages,
      meaningfulWords: extractionResult.meaningfulWords,
      meaningfulRatio: extractionResult.meaningfulRatio,
      extractionMethod: extractionResult.method,
      preview: extractedText.substring(0, 200),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'scripts'), scriptData);
    
    return NextResponse.json({
      success: true,
      scriptId: docRef.id,
      fileName: file.name,
      textLength: extractedText.length,
      pages: extractionResult.pages,
      meaningfulWords: extractionResult.meaningfulWords,
      meaningfulRatio: extractionResult.meaningfulRatio,
      extractionMethod: extractionResult.method,
      preview: extractedText.substring(0, 200) + '...',
      message: 'Teks PDF berhasil diekstrak dan disimpan'
    });
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json({
      success: false,
        error: error instanceof Error ? error.message : 'Error tidak diketahui'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    
    if (!projectId || !userId) {
      return NextResponse.json({ 
        success: false,
        error: 'projectId atau userId tidak ditemukan' 
      }, { status: 400 });
    }
    
    // Get all scripts for this user first
    const scriptsQuery = query(
      collection(db, 'scripts'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(scriptsQuery);
    const allScripts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Filter by projectId in memory and sort by createdAt
    const scripts = allScripts
      .filter(script => script.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({
      success: true,
      scripts
    });
    
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json({
      success: false,
        error: error instanceof Error ? error.message : 'Error tidak diketahui'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get('scriptId');
    const userId = searchParams.get('userId');
    
    if (!scriptId || !userId) {
      return NextResponse.json({ 
        success: false,
        error: 'scriptId atau userId tidak ditemukan' 
      }, { status: 400 });
    }
    
    // Delete the script document
    await deleteDoc(doc(db, 'scripts', scriptId));
    
    return NextResponse.json({
      success: true,
      message: 'Naskah berhasil dihapus'
    });
    
  } catch (error) {
    console.error('Error deleting script:', error);
    return NextResponse.json({
      success: false,
        error: error instanceof Error ? error.message : 'Error tidak diketahui'
    }, { status: 500 });
  }
}
