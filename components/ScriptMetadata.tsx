import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Palette,
  TrendingUp,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react';
import StyleDNAViewer from './StyleDNAViewer';
import { StyleDNA } from '@/types/style-dna';

interface ScriptMetadataProps {
  metadata: {
    episode_number: number | null;
    last_scene_id: string;
    last_scene_summary: string;
    main_characters: string[];
    current_tone_style: string;
    open_threads: string[];
    assumptions_made: string[];
    confidence_score: number;
    style_dna_used?: string;
  };
  recap?: string;
  styleDNA?: StyleDNA;
}

export default function ScriptMetadata({ metadata, recap, styleDNA }: ScriptMetadataProps) {
  const [showStyleDNA, setShowStyleDNA] = useState(false);
  
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (score: number) => {
    if (score >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (score >= 0.6) return <AlertCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3 p-3 sm:p-4 bg-gray-25 border border-gray-200 rounded-xl">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-300">
        <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Script Analysis</h3>
      </div>

      {/* Recap Section */}
      {recap && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 sm:p-3">
          <div className="flex items-start space-x-2">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-1">Context Recap</h4>
              <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">{recap}</p>
            </div>
          </div>
        </div>
      )}

      {/* Episode Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-2 sm:p-3">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
            <h4 className="text-xs sm:text-sm font-medium text-gray-800">Episode Info</h4>
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Episode:</span>
              <span className="font-medium text-gray-800">
                {metadata.episode_number || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Scene:</span>
              <span className="font-medium text-gray-800 text-right max-w-24 sm:max-w-32 truncate">
                {metadata.last_scene_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tone:</span>
              <span className="font-medium text-gray-800">
                {metadata.current_tone_style}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="bg-white border border-gray-200 rounded-xl p-2 sm:p-3">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
            <h4 className="text-xs sm:text-sm font-medium text-gray-800">Analysis Quality</h4>
          </div>
          <div className="flex items-center space-x-2">
            {getConfidenceIcon(metadata.confidence_score)}
            <span className="text-xs sm:text-sm font-medium text-gray-800">
              Confidence: {(metadata.confidence_score * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div 
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  metadata.confidence_score >= 0.8 ? 'bg-green-500' :
                  metadata.confidence_score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metadata.confidence_score * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Characters */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 sm:p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
          <h4 className="text-xs sm:text-sm font-medium text-gray-800">Main Characters</h4>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {metadata.main_characters.map((character, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border"
            >
              {character}
            </span>
          ))}
        </div>
      </div>

      {/* Last Scene Summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 sm:p-3">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
          <h4 className="text-xs sm:text-sm font-medium text-gray-800">Last Scene Summary</h4>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
          {metadata.last_scene_summary}
        </p>
      </div>

      {/* Open Threads */}
      {metadata.open_threads.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-2 sm:p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
            <h4 className="text-xs sm:text-sm font-medium text-gray-800">Open Plot Threads</h4>
          </div>
          <ul className="space-y-1.5 sm:space-y-2">
            {metadata.open_threads.map((thread, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">{thread}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assumptions */}
      {metadata.assumptions_made.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 sm:p-3">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
            <h4 className="text-xs sm:text-sm font-medium text-amber-800">Assumptions Made</h4>
          </div>
          <ul className="space-y-1.5 sm:space-y-2">
            {metadata.assumptions_made.map((assumption, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-amber-700 leading-relaxed">{assumption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Style DNA Status */}
      {(metadata.style_dna_used || styleDNA) && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 sm:p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
              <h4 className="text-xs sm:text-sm font-medium text-green-800">Style DNA</h4>
            </div>
            {styleDNA && (
              <button
                onClick={() => setShowStyleDNA(!showStyleDNA)}
                className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
              >
                {showStyleDNA ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>{showStyleDNA ? 'Sembunyikan' : 'Lihat Detail'}</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-green-700 ml-5 mb-2">
            {metadata.style_dna_used || (styleDNA ? 'Style DNA tersedia - klik "Lihat Detail" untuk melihat analisis lengkap' : 'Style DNA tidak tersedia')}
          </p>
          
          {/* Style DNA Detail */}
          {showStyleDNA && styleDNA && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <StyleDNAViewer 
                styleDNA={styleDNA} 
                onClose={() => {}} 
                showActions={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
