"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';
import { GeminiOCRReader } from '@/lib/gemini-ocr-reader';
import { doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Script {
  id: string;
  fileName: string;
  fileSize: number;
  extractedText: string;
  textLength: number;
  pages?: number;
  meaningfulWords?: number;
  meaningfulRatio?: number;
  extractionMethod?: string;
  preview?: string;
  createdAt: string;
  updatedAt: string;
}

interface PDFExtractorProps {
  projectId: string;
}

export default function PDFExtractor({ projectId }: PDFExtractorProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(true);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [message, setMessage] = useState('');
  const [extractionProgress, setExtractionProgress] = useState({
    step: '',
    percentage: 0,
    details: '',
    estimatedTime: '',
    startTime: 0
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [deletingScript, setDeletingScript] = useState<string | null>(null);

  // Load existing scripts (read directly from Firestore to avoid API issues in static prod)
  const loadScripts = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingScripts(true);
      // Query by userId first (avoids composite index), then filter by projectId in memory
      const q = query(
        collection(db, 'scripts'),
        where('userId', '==', user.id)
      );
      const snapshot = await getDocs(q);
      const allScripts = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      const filtered = allScripts
        .filter(s => s.projectId === projectId)
        .map(s => {
          const createdAt = typeof s.createdAt === 'string'
            ? s.createdAt
            : s.createdAt?.toDate?.() ? s.createdAt.toDate().toISOString() : new Date().toISOString();
          const updatedAt = typeof s.updatedAt === 'string'
            ? s.updatedAt
            : s.updatedAt?.toDate?.() ? s.updatedAt.toDate().toISOString() : createdAt;
          return { ...s, createdAt, updatedAt } as Script;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setScripts(filtered);
    } catch (error) {
      console.error('Error loading scripts:', error);
    } finally {
      setLoadingScripts(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, [projectId, user?.id]);

  // Real-time timer for extraction progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (loading && extractionProgress.startTime > 0) {
      interval = setInterval(() => {
        const elapsed = Math.round((Date.now() - extractionProgress.startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, extractionProgress.startTime]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setMessage('Silakan pilih file PDF');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setMessage('Ukuran file terlalu besar (maksimal 10MB)');
        return;
      }
      setFile(selectedFile);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.id) return;

    setLoading(true);
    setMessage('');
    const startTime = Date.now();
    setExtractionProgress({
      step: 'Preparing file...',
      percentage: 10,
      details: `Processing ${file.name} (${formatFileSize(file.size)})`,
      estimatedTime: 'Estimating time...',
      startTime
    });

    try {
      // Step 1: Prepare form data
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setExtractionProgress({
        step: 'Uploading file...',
        percentage: 25,
        details: 'Sending PDF to server for processing',
        estimatedTime: `Elapsed: ${elapsed}s`,
        startTime
      });

      // Step 2: Start extraction (client-side)
      const elapsed2 = Math.round((Date.now() - startTime) / 1000);
      setExtractionProgress({
        step: 'Extracting text...',
        percentage: 50,
        details: 'Using Gemini OCR to read PDF content',
        estimatedTime: `Elapsed: ${elapsed2}s`,
        startTime
      });

      const extraction = await GeminiOCRReader.extractText(file);

      // Step 3: Processing and saving to Firestore
      const elapsed3 = Math.round((Date.now() - startTime) / 1000);
      setExtractionProgress({
        step: 'Processing results...',
        percentage: 80,
        details: 'Saving extracted text to database',
        estimatedTime: `Elapsed: ${elapsed3}s`,
        startTime
      });

      if (extraction.success) {
        const nowIso = new Date().toISOString();
        const docData = {
          projectId,
          userId: user.id,
          fileName: file.name,
          fileSize: file.size,
          extractedText: extraction.text,
          textLength: extraction.characters,
          pages: extraction.pages,
          meaningfulWords: extraction.meaningfulWords,
          meaningfulRatio: extraction.meaningfulRatio,
          extractionMethod: extraction.method,
          preview: extraction.text.substring(0, 200),
          createdAt: nowIso,
          updatedAt: nowIso
        };

        await addDoc(collection(db, 'scripts'), docData);

        const totalTime = Math.round((Date.now() - startTime) / 1000);
        setExtractionProgress({
          step: 'Complete!',
          percentage: 100,
          details: `Successfully extracted ${extraction.characters} characters`,
          estimatedTime: `Completed in ${totalTime}s`,
          startTime
        });

        setMessage(`✅ Script uploaded and processed successfully! Extracted ${extraction.characters} characters`);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('pdf-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Reload scripts
        loadScripts();
        
        // Clear progress after 3 seconds
        setTimeout(() => {
          setExtractionProgress({
            step: '',
            percentage: 0,
            details: '',
            estimatedTime: '',
            startTime: 0
          });
        }, 3000);
      } else {
        setMessage(`❌ Error: ${extraction.error || 'Extraction failed'}`);
        setExtractionProgress({
          step: 'Error',
          percentage: 0,
          details: extraction.error || 'Unknown error occurred',
          estimatedTime: '',
          startTime: 0
        });
      }
    } catch (error) {
      setMessage(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setExtractionProgress({
        step: 'Error',
        percentage: 0,
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        estimatedTime: '',
        startTime: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!user?.id) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this script? This will also delete all related Style DNA and Knowledge Graph analyses. This action cannot be undone.')) {
      return;
    }

    setDeletingScript(scriptId);

    try {
      // Delete related analyses (Style DNA and Knowledge Graph) then delete script
      // 1) Find and delete related Style DNA analyses
      const styleDNAQuery = query(
        collection(db, 'styleDNA'),
        where('scriptId', '==', scriptId),
        where('userId', '==', user.id)
      );
      const styleDNASnapshot = await getDocs(styleDNAQuery);
      const styleDNADeletions = styleDNASnapshot.docs.map(d => deleteDoc(d.ref));

      // 2) Find and delete related Knowledge Graph analyses
      const knowledgeGraphQuery = query(
        collection(db, 'knowledgeGraphs'),
        where('scriptId', '==', scriptId),
        where('userId', '==', user.id)
      );
      const knowledgeGraphSnapshot = await getDocs(knowledgeGraphQuery);
      const knowledgeGraphDeletions = knowledgeGraphSnapshot.docs.map(d => deleteDoc(d.ref));

      // 3) Delete script document
      const scriptRef = doc(db, 'scripts', scriptId);
      const scriptDeletion = deleteDoc(scriptRef);

      await Promise.all([...styleDNADeletions, ...knowledgeGraphDeletions, scriptDeletion]);

      const totalAnalysesDeleted = styleDNASnapshot.docs.length + knowledgeGraphSnapshot.docs.length;
      setMessage(`✅ Script deleted successfully${totalAnalysesDeleted > 0 ? ` (and ${totalAnalysesDeleted} related analyses)` : ''}`);
      // Remove from local state
      setScripts(scripts.filter(script => script.id !== scriptId));
      // Clear selected script if it was deleted
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null);
      }
    } catch (error) {
      setMessage(`❌ Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingScript(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📄 Upload Script</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="pdf-file" className="block text-sm font-medium mb-2">
              Pilih File Naskah
            </label>
            <input
              id="pdf-file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format yang didukung: PDF • Ukuran maksimal: 10MB
            </p>
          </div>

          {file && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <strong>Siap diupload:</strong> {file.name} ({formatFileSize(file.size)})
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {extractionProgress.step || 'Mengekstrak Teks...'}
              </>
            ) : (
              'Upload & Ekstrak Teks'
            )}
          </Button>

          {/* Progress Indicator */}
          {loading && extractionProgress.step && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  {extractionProgress.step}
                </span>
                <span className="text-sm text-blue-600">
                  {extractionProgress.percentage}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${extractionProgress.percentage}%` }}
                ></div>
              </div>
              
              {/* Progress Details */}
              <div className="flex justify-between items-center">
                <p className="text-xs text-blue-600">
                  {extractionProgress.details}
                </p>
                {extractionProgress.estimatedTime && (
                  <p className="text-xs text-blue-500 font-medium">
                    {extractionProgress.percentage === 100 ? extractionProgress.estimatedTime : `${elapsedTime}s elapsed`}
                  </p>
                )}
              </div>
              
              {/* Step Indicators */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <div className={`flex items-center ${extractionProgress.percentage >= 10 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${extractionProgress.percentage >= 10 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  Upload
                </div>
                <div className={`flex items-center ${extractionProgress.percentage >= 50 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${extractionProgress.percentage >= 50 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  <span className="flex items-center">
                    <span className="mr-1">🤖</span>
                    Gemini OCR
                  </span>
                </div>
                <div className={`flex items-center ${extractionProgress.percentage >= 80 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${extractionProgress.percentage >= 80 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  Process
                </div>
                <div className={`flex items-center ${extractionProgress.percentage >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${extractionProgress.percentage >= 100 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  <span className="flex items-center">
                    <span className="mr-1">✅</span>
                    Complete
                  </span>
                </div>
              </div>
              
              {/* Additional Info */}
              {extractionProgress.percentage >= 50 && extractionProgress.percentage < 100 && (
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
                  <span className="font-medium">💡 Tip:</span> Gemini OCR is processing your PDF. This may take 10-30 seconds depending on file size and complexity.
                </div>
              )}
            </div>
          )}

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </Card>

      {/* Scripts List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📚 Naskah Anda</h3>
        
        {loadingScripts ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Belum ada naskah yang diupload.</p>
            <p className="text-sm">Upload naskah pertama Anda untuk memulai.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedScript?.id === script.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedScript(script)}
                  >
                    <h4 className="font-medium text-gray-900">{script.fileName}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {script.textLength.toLocaleString()} characters • {formatFileSize(script.fileSize)} • {formatDate(script.createdAt)}
                    </p>
                    {script.meaningfulRatio && (
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          script.meaningfulRatio > 50 ? 'bg-green-100 text-green-700' :
                          script.meaningfulRatio > 20 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {script.meaningfulRatio.toFixed(1)}% meaningful
                        </span>
                        {script.pages && (
                          <span className="text-gray-500">
                            {script.pages} page{script.pages > 1 ? 's' : ''}
                          </span>
                        )}
                        {script.extractionMethod && (
                          <span className="text-gray-500">
                            {script.extractionMethod}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400">
                      {script.id.substring(0, 8)}...
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScript(script.id);
                      }}
                      disabled={deletingScript === script.id}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Delete script"
                    >
                      {deletingScript === script.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Script Content Viewer */}
      {selectedScript && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📖 {selectedScript.fileName}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedScript(null)}
            >
              Tutup
            </Button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {selectedScript.extractedText}
            </pre>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Panjang teks: {selectedScript.textLength.toLocaleString()} karakter</p>
            <p>Diekstrak pada: {formatDate(selectedScript.createdAt)}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
