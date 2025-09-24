"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Palette, Network, Calendar, FileText, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { KnowledgeGraph } from '@/types/database';
import { StyleDNA } from '@/types/style-dna';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';

interface ScriptInfo {
  fileName: string;
  textLength: number;
  createdAt: Date;
}

interface AnalysisItem {
  id: string;
  type: 'style-dna' | 'knowledge-graph';
  scriptId: string;
  scriptInfo: ScriptInfo;
  createdAt: Date;
  updatedAt: Date;
  // Style DNA fields
  voice?: string[];
  themes?: string[];
  characters?: string[];
  narrative?: string[];
  dialog?: string[];
  strengths?: string[];
  examples?: string[];
  confidence?: number;
  // Knowledge Graph fields
  entities?: Array<{name: string; type: string; description: string}>;
  relationships?: Array<{from: string; to: string; type: string}>;
  timeline?: Array<{event: string; order: number}>;
}

interface AnalysisHistoryProps {
  projectId: string;
  onViewAnalysis: (analysis: AnalysisItem) => void;
  onAnalysisDeleted?: () => void;
}

export default function AnalysisHistory({ projectId, onViewAnalysis, onAnalysisDeleted }: AnalysisHistoryProps) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string; type: string; name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAnalysisHistory();
    }
  }, [user?.id, projectId]);

  const fetchAnalysisHistory = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get Style DNA history (query by userId only to avoid composite index)
      const styleDNAQuery = query(
        collection(db, 'styleDNA'),
        where('userId', '==', user.id)
      );
      
      const styleDNASnapshot = await getDocs(styleDNAQuery);
      const styleDNAHistory = styleDNASnapshot.docs
        .map(doc => ({
          id: doc.id,
          type: 'style-dna' as const,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
        } as any))
        .filter((item: any) => item.projectId === projectId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Get Knowledge Graph history (query by userId only to avoid composite index)
      const knowledgeGraphQuery = query(
        collection(db, 'knowledgeGraphs'),
        where('userId', '==', user.id)
      );
      
      const knowledgeGraphSnapshot = await getDocs(knowledgeGraphQuery);
      const knowledgeGraphHistory = knowledgeGraphSnapshot.docs
        .map(doc => ({
          id: doc.id,
          type: 'knowledge-graph' as const,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt)
        } as any))
        .filter((item: any) => item.projectId === projectId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Get script information for each analysis
      const scriptIds = Array.from(new Set([
        ...styleDNAHistory.map((item: any) => item.scriptId),
        ...knowledgeGraphHistory.map((item: any) => item.scriptId)
      ]));

      const scriptsInfo: any = {};
      for (const scriptId of scriptIds) {
        try {
          const scriptQuery = query(
            collection(db, 'scripts'),
            where('__name__', '==', scriptId)
          );
          const scriptDoc = await getDocs(scriptQuery);
          if (!scriptDoc.empty) {
            const scriptData = scriptDoc.docs[0].data();
            scriptsInfo[scriptId] = {
              fileName: scriptData.fileName,
              textLength: scriptData.textLength,
              createdAt: scriptData.createdAt?.toDate?.() || new Date(scriptData.createdAt)
            };
          }
        } catch (error) {
          console.warn(`Could not fetch script info for ${scriptId}:`, error);
        }
      }

      // Combine and sort all analysis by creation date
      const allAnalysis = [
        ...styleDNAHistory.map(item => ({
          ...item,
          scriptInfo: scriptsInfo[item.scriptId] || { fileName: 'Unknown Script', textLength: 0, createdAt: new Date() }
        })),
        ...knowledgeGraphHistory.map(item => ({
          ...item,
          scriptInfo: scriptsInfo[item.scriptId] || { fileName: 'Unknown Script', textLength: 0, createdAt: new Date() }
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAnalysis(allAnalysis);
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setError('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnalysisTypeIcon = (type: string) => {
    return type === 'style-dna' ? (
      <Palette className="h-5 w-5 text-blue-600" />
    ) : (
      <Network className="h-5 w-5 text-green-600" />
    );
  };

  const getAnalysisTypeLabel = (type: string) => {
    return type === 'style-dna' ? 'Style DNA' : 'Knowledge Graph';
  };

  const getAnalysisTypeColor = (type: string) => {
    return type === 'style-dna' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
  };

  const handleDeleteAnalysis = async () => {
    if (!deleteConfirm || !user?.id) return;
    
    setDeleting(true);
    try {
      // Delete from the appropriate collection
      const collectionName = deleteConfirm.type === 'style-dna' ? 'styleDNA' : 'knowledgeGraphs';
      await deleteDoc(doc(db, collectionName, deleteConfirm.id));
      
      // Remove the deleted analysis from the list
      setAnalysis(prev => prev.filter(item => item.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      onAnalysisDeleted?.();
    } catch (error) {
      console.error('Error deleting analysis:', error);
      setError('Failed to delete analysis');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" className="mr-3" />
          <span className="text-gray-600">Memuat riwayat analisis...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalysisHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </Card>
    );
  }

  if (analysis.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Analisis Ditemukan</h3>
          <p className="text-gray-600">
            Upload naskah dan jalankan analisis untuk melihat hasil Style DNA dan Knowledge Graph Anda di sini.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Riwayat Analisis</h3>
        <span className="text-sm text-gray-500">
          {analysis.length} {analysis.length === 1 ? 'analisis' : 'analisis'} ditemukan
        </span>
      </div>

      <div className="space-y-3">
        {analysis.map((item) => (
          <Card key={item.id} className={`p-4 border ${getAnalysisTypeColor(item.type)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getAnalysisTypeIcon(item.type)}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getAnalysisTypeLabel(item.type)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Dari: {item.scriptInfo.fileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>{item.scriptInfo.textLength.toLocaleString()} chars</span>
                  </div>
                  {item.type === 'style-dna' && item.confidence && (
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Tingkat Kepercayaan: {item.confidence}%</span>
                    </div>
                  )}
                </div>

                {/* Preview of analysis content */}
                <div className="text-sm text-gray-700">
                  {item.type === 'style-dna' ? (
                    <div className="space-y-1">
                      {item.voice && item.voice.length > 0 && (
                        <div>
                          <span className="font-medium">Suara:</span> {item.voice.slice(0, 2).join(', ')}
                          {item.voice.length > 2 && ` +${item.voice.length - 2} lainnya`}
                        </div>
                      )}
                      {item.themes && item.themes.length > 0 && (
                        <div>
                          <span className="font-medium">Tema:</span> {item.themes.slice(0, 2).join(', ')}
                          {item.themes.length > 2 && ` +${item.themes.length - 2} lainnya`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {item.entities && item.entities.length > 0 && (
                        <div>
                          <span className="font-medium">Entitas:</span> {item.entities.length} ditemukan
                        </div>
                      )}
                      {item.relationships && item.relationships.length > 0 && (
                        <div>
                          <span className="font-medium">Hubungan:</span> {item.relationships.length} koneksi
                        </div>
                      )}
                      {item.timeline && item.timeline.length > 0 && (
                        <div>
                          <span className="font-medium">Timeline:</span> {item.timeline.length} peristiwa
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onViewAnalysis(item)}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  <span>Lihat</span>
                </button>
                <button
                  onClick={() => setDeleteConfirm({
                    id: item.id,
                    type: item.type,
                    name: `${getAnalysisTypeLabel(item.type)} - ${item.scriptInfo.fileName}`
                  })}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Hapus Analisis</h3>
                <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.name}</strong>? Ini akan menghapus analisis secara permanen dari proyek Anda.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAnalysis}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
