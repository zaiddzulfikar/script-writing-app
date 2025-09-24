"use client";

import { useState } from 'react';
import { 
  Palette, 
  Eye, 
  Download, 
  Share, 
  BarChart3, 
  Target, 
  Users, 
  Globe, 
  Heart, 
  Lightbulb,
  TrendingUp,
  BookOpen,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StyleDNA } from '@/types/style-dna';

interface StyleDNAViewerProps {
  styleDNA: StyleDNA;
  onClose?: () => void;
  showActions?: boolean;
}

export default function StyleDNAViewer({ 
  styleDNA, 
  onClose, 
  showActions = true 
}: StyleDNAViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([]));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
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

  const renderTagList = (items: string[] | undefined, color: string) => {
    if (!items || items.length === 0) return <span className="text-gray-500">Tidak tersedia</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((item, index) => (
          <span key={index} className={`px-2 py-1 text-xs rounded ${color}`}>
            {item}
          </span>
        ))}
      </div>
    );
  };

  const renderSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
    description?: string
  ) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <Card className="p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {content}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header dengan Confidence Score */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Style DNA Analysis</h2>
            <p className="text-gray-600">Analisis mendalam gaya penulisan berdasarkan 10 aspek kunci</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              {getConfidenceIcon(styleDNA.analysis?.confidence || 0)}
              <span className="text-sm font-medium text-gray-700">Confidence Score</span>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(styleDNA.analysis?.confidence || 0)}`}>
              {styleDNA.analysis?.confidence || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* 1. Tema Utama (Thematic Voice) */}
      {renderSection(
        'thematicVoice',
        'Tema Utama (Thematic Voice)',
        <Heart className="h-5 w-5 text-red-500" />,
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tema Utama</h4>
            {renderTagList(styleDNA.thematicVoice?.mainThemes, 'bg-red-100 text-red-800')}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Voice Tematis</h4>
            <p className="text-gray-700 text-sm">
              {styleDNA.thematicVoice?.thematicVoice || 'Tidak tersedia'}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Pesan/Filosofi Hidup</h4>
            {renderTagList(styleDNA.thematicVoice?.messagePhilosophy, 'bg-red-100 text-red-800')}
          </div>
        </div>,
        'Tema fundamental yang sering diangkat: Keluarga, Identitas, Cinta, Keadilan, Survival, Alienasi, Mimpi'
      )}

      {/* 2. Gaya Dialog */}
      {renderSection(
        'dialogueStyle',
        'Gaya Dialog',
        <Users className="h-5 w-5 text-blue-500" />,
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tipe Dialog</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                {styleDNA.dialogueStyle?.type || 'Tidak tersedia'}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pace</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                {styleDNA.dialogueStyle?.pace || 'Tidak tersedia'}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Humor</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                {styleDNA.dialogueStyle?.humor || 'Tidak tersedia'}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Karakteristik Dialog</h4>
            {renderTagList(styleDNA.dialogueStyle?.characteristics, 'bg-blue-100 text-blue-800')}
          </div>
        </div>,
        'Gaya dialog fundamental: Realistis, Puitis, Cepat & Tajam, Satir, Komedi, Formal'
      )}

      {/* 3. Karakterisasi */}
      {renderSection(
        'characterization',
        'Karakterisasi',
        <Target className="h-5 w-5 text-green-500" />,
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tipe Protagonis</h4>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
              {styleDNA.characterization?.protagonistType || 'Tidak tersedia'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Kedalaman Karakter</h4>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
              {styleDNA.characterization?.characterDepth || 'Tidak tersedia'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Pola Hubungan</h4>
            {renderTagList(styleDNA.characterization?.relationshipPatterns, 'bg-green-100 text-green-800')}
          </div>
        </div>,
        'Pola karakterisasi fundamental: Underdog, Anti-Hero, Outsider, Strong Female Lead, Tragic Hero'
      )}

      {/* 4. Dunia Cerita (World-Building) */}
      {renderSection(
        'worldBuilding',
        'Dunia Cerita (World-Building)',
        <Globe className="h-5 w-5 text-purple-500" />,
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tipe Dunia</h4>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
              {styleDNA.worldBuilding?.type || 'Tidak tersedia'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Atmosfer</h4>
            {renderTagList(styleDNA.worldBuilding?.atmosphere, 'bg-purple-100 text-purple-800')}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Elemen Budaya</h4>
            {renderTagList(styleDNA.worldBuilding?.culturalElements, 'bg-purple-100 text-purple-800')}
          </div>
        </div>,
        'Dunia cerita fundamental: Urban Realism, Rural, Futuristik, Fantasi, Historical, Slice of Life'
      )}

      {/* 5. Tone & Mood */}
      {renderSection(
        'toneMood',
        'Tone & Mood',
        <TrendingUp className="h-5 w-5 text-yellow-500" />,
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Tone Utama</h4>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
              {styleDNA.toneMood?.primaryTone || 'Tidak tersedia'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Perubahan Mood</h4>
            {renderTagList(styleDNA.toneMood?.moodShifts, 'bg-yellow-100 text-yellow-800')}
          </div>
        </div>,
        'Tone & mood fundamental: Dark & Gritty, Melancholic, Warm & Heartfelt, Light & Fun, Absurd, Suspenseful'
      )}

      {/* 6. Struktur Naratif */}
      {renderSection(
        'narrativeStructure',
        'Struktur Naratif',
        <BarChart3 className="h-5 w-5 text-indigo-500" />,
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tipe Struktur</h4>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                {styleDNA.narrativeStructure?.type || 'Tidak tersedia'}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pacing</h4>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                {styleDNA.narrativeStructure?.pacing || 'Tidak tersedia'}
              </span>
            </div>
          </div>
        </div>,
        'Struktur naratif fundamental: Linear, Non-Linear, Multiple POV, Fragmented, Circular, Anthology'
      )}

      {/* 7. Visual & Simbolisme */}
      {renderSection(
        'visualSymbolism',
        'Visual & Simbolisme',
        <Eye className="h-5 w-5 text-pink-500" />,
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Imaji Berulang</h4>
            {renderTagList(styleDNA.visualSymbolism?.recurringImages, 'bg-pink-100 text-pink-800')}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Simbol</h4>
            {renderTagList(styleDNA.visualSymbolism?.symbols, 'bg-pink-100 text-pink-800')}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Palet Warna</h4>
            {renderTagList(styleDNA.visualSymbolism?.colorPalette, 'bg-pink-100 text-pink-800')}
          </div>
        </div>,
        'Visual & simbolisme fundamental: Alam, Kota, Warna Dominan, Objek Simbolis, Motif Repetitif'
      )}

      {/* 8. Pacing (Ritme Cerita) */}
      {renderSection(
        'pacing',
        'Pacing (Ritme Cerita)',
        <Zap className="h-5 w-5 text-orange-500" />,
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tipe Pacing</h4>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded">
                {styleDNA.pacing?.type || 'Tidak tersedia'}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Eskalasi Konflik</h4>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded">
                {styleDNA.pacing?.conflictEscalation || 'Tidak tersedia'}
              </span>
            </div>
          </div>
        </div>,
        'Pacing fundamental: Slow-burn, Fast-paced, Balanced, Montage-driven'
      )}

      {/* 9. Genre Favorit */}
      {renderSection(
        'genrePreferences',
        'Genre Favorit',
        <BookOpen className="h-5 w-5 text-teal-500" />,
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Genre Utama</h4>
            <span className="px-2 py-1 bg-teal-100 text-teal-800 text-sm rounded">
              {styleDNA.genrePreferences?.primaryGenre || 'Tidak tersedia'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Kombinasi Genre</h4>
            {renderTagList(styleDNA.genrePreferences?.genreBlends, 'bg-teal-100 text-teal-800')}
          </div>
        </div>,
        'Genre fundamental: Drama, Komedi, Thriller, Horror, Sci-fi/Fantasi, Action, Art-house'
      )}

      {/* 10. Pesan / Filosofi Hidup */}
      {renderSection(
        'messagePhilosophy',
        'Pesan / Filosofi Hidup',
        <Lightbulb className="h-5 w-5 text-amber-500" />,
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Filosofi Inti</h4>
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded">
              {styleDNA.messagePhilosophy?.corePhilosophy || 'Tidak tersedia'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Pesan Utama</h4>
            {renderTagList(styleDNA.messagePhilosophy?.coreMessages, 'bg-amber-100 text-amber-800')}
          </div>
        </div>,
        'Filosofi hidup fundamental: Optimisme, Pessimisme, Humanisme, Eksistensialisme, Keadilan Sosial, Romantisisme'
      )}

      {/* Examples and Strengths */}
      {(styleDNA.analysis?.examples?.length || 0) > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contoh Kutipan</h3>
          <div className="space-y-3">
            {styleDNA.analysis?.examples?.map((example, index) => (
              <blockquote key={index} className="p-3 bg-gray-50 border-l-4 border-blue-500 text-sm italic">
                "{example}"
              </blockquote>
            ))}
          </div>
        </Card>
      )}

      {(styleDNA.analysis?.strengths?.length || 0) > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kekuatan Penulisan</h3>
          <div className="flex flex-wrap gap-2">
            {styleDNA.analysis?.strengths?.map((strength, index) => (
              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {strength}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Usage Recommendations */}
      {(styleDNA.usage?.recommendedFor?.length || 0) > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rekomendasi Penggunaan</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cocok Untuk</h4>
              <div className="flex flex-wrap gap-2">
                {styleDNA.usage?.recommendedFor?.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Kekuatan</h4>
              <div className="flex flex-wrap gap-2">
                {styleDNA.usage?.strengths?.map((strength, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
