'use client';

import React, { useState, useRef } from 'react';
// import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Eye,
  Download
} from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ScriptUpload as ScriptUploadType } from '../types/database';
import toast from 'react-hot-toast';

interface ScriptUploadProps {
  userId: string;
  onUploadComplete?: (scriptId: string) => void;
  maxFiles?: number;
}

interface UploadedScript {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
  statusText?: string;
  errorMessage?: string;
  scriptUpload?: ScriptUploadType;
  writerName?: string;
}

export default function ScriptUpload({ 
  userId, 
  onUploadComplete, 
  maxFiles = 5 
}: ScriptUploadProps) {
  const [uploadedScripts, setUploadedScripts] = useState<UploadedScript[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingScriptId, setUploadingScriptId] = useState<string | null>(null);
  const [writerName, setWriterName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        handleFileUpload(file);
      } else {
        alert('Hanya file .pdf yang diperbolehkan');
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    if (uploadedScripts.length >= maxFiles) {
      alert(`Maksimal ${maxFiles} file`);
      return;
    }

    if (!writerName.trim()) {
      alert('Mohon isi nama penulis terlebih dahulu');
      return;
    }

    const scriptId = Date.now().toString();
    const uploadedScript: UploadedScript = {
      id: scriptId,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploading',
      progress: 10,
      statusText: 'Mengupload file...',
      writerName: writerName.trim()
    };

    setUploadedScripts(prev => [...prev, uploadedScript]);
    setUploadingScriptId(scriptId);

    try {
      // TODO: Implement script upload functionality
      const uploadId = 'mock-upload-id';

      // Update with upload ID
      setUploadedScripts(prev => prev.map(script => 
        script.id === scriptId 
          ? { 
              ...script, 
              id: uploadId, 
              status: 'processing',
              progress: 20,
              statusText: 'File terupload, mulai ekstraksi...'
            }
          : script
      ));

      // Start polling for completion
      pollForCompletion(uploadId);

      // Show success toast
      toast.success('File berhasil diupload!');

      onUploadComplete?.(uploadId);
    } catch (error) {
      setUploadedScripts(prev => prev.map(script => 
        script.id === scriptId 
          ? { 
              ...script, 
              status: 'error', 
              errorMessage: error instanceof Error ? error.message : 'Upload failed'
            }
          : script
      ));
      
      // Show error toast
      toast.error('Gagal mengupload file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploadingScriptId(null);
    }
  };


  const pollForCompletion = async (uploadId: string) => {
    // TODO: Implement proper polling for script upload status
    // For now, just mark as completed after a short delay
    setTimeout(() => {
      setUploadedScripts(prev => prev.map(script => 
        script.id === uploadId 
          ? { 
              ...script, 
              status: 'completed',
              progress: 100
            }
          : script
      ));
      toast.success('File berhasil diproses!');
    }, 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeScript = (scriptId: string) => {
    setUploadedScripts(prev => prev.filter(script => script.id !== scriptId));
  };

  const getStatusIcon = (status: UploadedScript['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing': 
        return <LoadingSpinner size="sm" className="text-black" />
      case 'completed': 
        return <CheckCircle className="h-5 w-5 text-black" />
      case 'error': 
        return <AlertCircle className="h-5 w-5 text-black" />
      default: 
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  };

  const getStatusText = (status: UploadedScript['status']) => {
    switch (status) {
      case 'uploading': return 'Mengupload...'
      case 'processing': return 'Memproses file...'
      case 'completed': return 'Selesai'
      case 'error': return 'Error'
      default: return 'Pending'
    }
  };

  return (
    <div className="space-y-4">
      {/* Writer Name Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label htmlFor="writerName" className="block text-sm font-medium text-black mb-2">
          Nama Penulis
        </label>
        <input
          id="writerName"
          type="text"
          value={writerName}
          onChange={(e) => setWriterName(e.target.value)}
          placeholder="Masukkan nama penulis naskah..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          disabled={uploadingScriptId !== null}
        />
        <p className="text-xs text-gray-500 mt-1">
          Nama penulis untuk identifikasi naskah
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? 'border-black bg-gray-100' 
            : 'border-gray-400 hover:border-black'
          }
          ${uploadedScripts.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploadedScripts.length || uploadedScripts.length < maxFiles ? fileInputRef.current?.click() : null}
      >
        <Upload className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-black mb-2">Upload Naskah</h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag & drop file .pdf atau klik untuk memilih file
        </p>
        <p className="text-xs text-gray-500">
          Maksimal {maxFiles} file, format .pdf saja
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploaded Files List */}
      {uploadedScripts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-black">Naskah yang Diupload:</h4>
          {uploadedScripts.map((script) => (
            <div
              key={script.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(script.status)}
                  <div>
                    <p className="text-sm font-medium text-black">{script.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {(script.fileSize / 1024).toFixed(1)} KB • {getStatusText(script.status)}
                    </p>
                    {script.writerName && (
                      <p className="text-xs text-blue-600 mt-1">
                        Penulis: {script.writerName}
                      </p>
                    )}
                    {script.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{script.errorMessage}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {script.status === 'completed' && (
                    <>
                      <button
                        onClick={() => {/* TODO: View extracted text */}}
                        className="p-1 text-gray-600 hover:text-black"
                        title="Lihat teks yang diekstrak"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {/* TODO: Download */}}
                        className="p-1 text-gray-600 hover:text-black"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => removeScript(script.id)}
                    className="p-1 text-gray-600 hover:text-red-600"
                    title="Hapus"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar for Processing */}
              {(script.status === 'uploading' || script.status === 'processing') && (
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-black h-2 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${script.progress || 0}%` }} 
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {script.statusText || getStatusText(script.status)} 
                    {script.status === 'processing' && ' Ini mungkin memakan waktu beberapa menit.'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tentang Upload Naskah</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Upload naskah dalam format PDF</li>
          <li>• Sistem akan menyimpan naskah untuk referensi</li>
          <li>• Naskah dapat digunakan untuk analisis dan referensi</li>
          <li>• Maksimal 5 file per sesi</li>
        </ul>
      </div>
    </div>
  );
}
