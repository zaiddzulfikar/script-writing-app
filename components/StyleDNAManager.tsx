"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Palette, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Settings,
  BarChart3,
  Target,
  Zap,
  BookOpen,
  Users,
  Globe,
  Heart,
  Lightbulb,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { StyleDNA, StyleDNAAnalysisRequest, StyleDNAGenerationOptions } from '@/types/style-dna';
import { styleDNAAnalyzer } from '@/lib/style-dna-analyzer';
import { styleDNAGenerator } from '@/lib/style-dna-generator';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

interface StyleDNAManagerProps {
  projectId: string;
  onStyleDNASelect?: (styleDNA: StyleDNA) => void;
  selectedStyleDNA?: StyleDNA | null;
}

export default function StyleDNAManager({ 
  projectId, 
  onStyleDNASelect, 
  selectedStyleDNA 
}: StyleDNAManagerProps) {
  const { user } = useAuth();
  const [styleDNAs, setStyleDNAs] = useState<StyleDNA[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({
    step: '',
    percentage: 0,
    details: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [usageOptions, setUsageOptions] = useState<StyleDNAGenerationOptions>({
    adaptationMode: 'flexible',
    focusAreas: [],
    intensity: 80,
    preserveOriginal: false
  });

  // Load Style DNAs for project
  useEffect(() => {
    if (projectId && user?.id) {
      loadStyleDNAs();
    }
  }, [projectId, user?.id]);

  const loadStyleDNAs = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'styleDNA'),
        where('projectId', '==', projectId),
        where('userId', '==', user?.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const styleDNAs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as StyleDNA[];
      
      setStyleDNAs(styleDNAs);
    } catch (error) {
      console.error('Error loading Style DNAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeScript = async () => {
    if (!selectedScript || !user?.id) return;

    try {
      setLoading(true);
      setAnalysisProgress({
        step: 'Starting Style DNA Analysis...',
        percentage: 0,
        details: 'Preparing analysis...'
      });

      const request: StyleDNAAnalysisRequest = {
        scriptText: selectedScript.extractedText,
        projectId,
        userId: user.id,
        analysisDepth: 'comprehensive',
        includeExamples: true,
        includeRecommendations: true
      };

      // Simulate progress updates
      const progressSteps = [
        { step: 'Analyzing Thematic Voice...', percentage: 20, details: 'Extracting main themes and philosophical stance...' },
        { step: 'Analyzing Dialogue Style...', percentage: 40, details: 'Identifying dialogue characteristics and patterns...' },
        { step: 'Analyzing Characterization...', percentage: 60, details: 'Extracting character types and development patterns...' },
        { step: 'Analyzing Narrative Structure...', percentage: 80, details: 'Identifying narrative techniques and world-building...' },
        { step: 'Synthesizing Style DNA...', percentage: 100, details: 'Creating comprehensive Style DNA profile...' }
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setAnalysisProgress(progressSteps[currentStep]);
          currentStep++;
        } else {
          clearInterval(progressInterval);
        }
      }, 2000);

      const result = await styleDNAAnalyzer.analyzeScript(request);
      
      clearInterval(progressInterval);
      setAnalysisResult(result);
      setShowAnalysisModal(false);
      setShowCreateModal(true);

      // Save to Firestore
      await addDoc(collection(db, 'styleDNA'), {
        ...result.styleDNA,
        userId: user.id,
        projectId,
        scriptId: selectedScript.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await loadStyleDNAs();

    } catch (error) {
      console.error('Error analyzing script:', error);
      alert('Gagal menganalisis script. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStyleDNA = async (styleDNAId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus Style DNA ini?')) return;

    try {
      await deleteDoc(doc(db, 'styleDNA', styleDNAId));
      await loadStyleDNAs();
    } catch (error) {
      console.error('Error deleting Style DNA:', error);
      alert('Gagal menghapus Style DNA. Silakan coba lagi.');
    }
  };

  const handleSelectStyleDNA = (styleDNA: StyleDNA) => {
    onStyleDNASelect?.(styleDNA);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 60) return <AlertCircle className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Palette className="h-6 w-6 mr-2 text-blue-600" />
            Style DNA Manager
          </h2>
          <p className="text-gray-600 mt-1">
            Kelola dan gunakan Style DNA untuk konsistensi penulisan
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowAnalysisModal(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Analisis Script
          </Button>
        </div>
      </div>

      {/* Style DNA List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styleDNAs.map((styleDNA) => (
          <Card key={styleDNA.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Style DNA Profile
                </h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(styleDNA.analysis?.confidence || 0)}`}>
                    {getConfidenceIcon(styleDNA.analysis?.confidence || 0)}
                    <span className="ml-1">{styleDNA.analysis?.confidence || 0}% Confidence</span>
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Dibuat: {formatDate(styleDNA.createdAt)}
                </p>
              </div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectStyleDNA(styleDNA)}
                  className={selectedStyleDNA?.id === styleDNA.id ? 'bg-blue-50 border-blue-500' : ''}
                >
                  <Target className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUsageModal(true)}
                >
                  <Zap className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteStyleDNA(styleDNA.id!)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Style DNA Preview */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Tema Utama</h4>
                <div className="flex flex-wrap gap-1">
                  {styleDNA.thematicVoice?.mainThemes?.slice(0, 3).map((theme, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Gaya Dialog</h4>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {styleDNA.dialogueStyle?.type || 'N/A'}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {styleDNA.dialogueStyle?.pace || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Tone & Mood</h4>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {styleDNA.toneMood?.primaryTone || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Genre</h4>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                    {styleDNA.genrePreferences?.primaryGenre || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleSelectStyleDNA(styleDNA)}
                  className="flex-1"
                >
                  {selectedStyleDNA?.id === styleDNA.id ? 'Dipilih' : 'Pilih'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUsageModal(true)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {styleDNAs.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada Style DNA
          </h3>
          <p className="text-gray-600 mb-6">
            Analisis script untuk membuat Style DNA pertama Anda
          </p>
          <Button onClick={() => setShowAnalysisModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Analisis Script
          </Button>
        </Card>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Analisis Script untuk Style DNA
            </h3>
            <p className="text-gray-600 mb-4">
              Pilih script yang akan dianalisis untuk membuat Style DNA
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Script yang akan dianalisis
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={selectedScript?.id || ''}
                  onChange={(e) => {
                    const script = { id: e.target.value, extractedText: 'Sample script text...' };
                    setSelectedScript(script);
                  }}
                >
                  <option value="">Pilih script...</option>
                  <option value="script1">Script 1 - Drama Keluarga</option>
                  <option value="script2">Script 2 - Komedi Romantis</option>
                  <option value="script3">Script 3 - Thriller Psikologis</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleAnalyzeScript}
                disabled={!selectedScript || loading}
                className="flex-1"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Mulai Analisis
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAnalysisModal(false)}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Progress */}
      {loading && analysisProgress.step && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Menganalisis Style DNA
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{analysisProgress.step}</span>
                <span className="text-sm text-gray-500">{analysisProgress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysisProgress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{analysisProgress.details}</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Options Modal */}
      {showUsageModal && selectedStyleDNA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pengaturan Style DNA
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode Adaptasi
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={usageOptions.adaptationMode}
                  onChange={(e) => setUsageOptions({
                    ...usageOptions,
                    adaptationMode: e.target.value as any
                  })}
                >
                  <option value="strict">Ketat - Ikuti Style DNA dengan ketat</option>
                  <option value="flexible">Fleksibel - Sesuaikan dengan proyek</option>
                  <option value="inspired">Terinspirasi - Gunakan sebagai referensi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intensity
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={usageOptions.intensity}
                  onChange={(e) => setUsageOptions({
                    ...usageOptions,
                    intensity: parseInt(e.target.value)
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Subtle (0%)</span>
                  <span>Normal (50%)</span>
                  <span>Strong (100%)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fokus Area (Opsional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'thematicVoice', 'dialogueStyle', 'characterization', 'worldBuilding',
                    'toneMood', 'narrativeStructure', 'visualSymbolism', 'pacing',
                    'genrePreferences', 'messagePhilosophy'
                  ].map((area) => (
                    <label key={area} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={usageOptions.focusAreas?.includes(area) || false}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUsageOptions({
                              ...usageOptions,
                              focusAreas: [...(usageOptions.focusAreas || []), area]
                            });
                          } else {
                            setUsageOptions({
                              ...usageOptions,
                              focusAreas: (usageOptions.focusAreas || []).filter(a => a !== area)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  handleSelectStyleDNA(selectedStyleDNA);
                  setShowUsageModal(false);
                }}
                className="flex-1"
              >
                Terapkan
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUsageModal(false)}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
