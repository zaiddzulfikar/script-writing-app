"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Palette, Network, Calendar, FileText, X, Copy, Check } from 'lucide-react';
import StyleDNAViewer from './StyleDNAViewer';
import { StyleDNA } from '@/types/style-dna';

interface AnalysisItem {
  id: string;
  type: 'style-dna' | 'knowledge-graph';
  scriptId: string;
  scriptInfo: {
    fileName: string;
    textLength: number;
    createdAt: Date;
  };
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

interface AnalysisViewerProps {
  analysis: AnalysisItem;
  onClose: () => void;
}

export default function AnalysisViewer({ analysis, onClose }: AnalysisViewerProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    return type === 'style-dna' ? (
      <Palette className="h-6 w-6 text-blue-600" />
    ) : (
      <Network className="h-6 w-6 text-green-600" />
    );
  };

  const getAnalysisTypeLabel = (type: string) => {
    return type === 'style-dna' ? 'Style DNA Analysis' : 'Knowledge Graph Analysis';
  };

  const getAnalysisTypeColor = (type: string) => {
    return type === 'style-dna' ? 'text-blue-600' : 'text-green-600';
  };

  const renderStyleDNA = () => (
    <div className="space-y-6">
      {/* Complete Style DNA Analysis - All 10 Aspects */}
      <StyleDNAViewer 
        styleDNA={analysis as unknown as StyleDNA} 
        onClose={() => {}}
        showActions={false}
      />

    </div>
  );

  const renderKnowledgeGraph = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        {getAnalysisTypeIcon('knowledge-graph')}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Knowledge Graph Analysis</h2>
          <p className="text-sm text-gray-600">Analysis of entities, relationships, and timeline</p>
        </div>
      </div>

      {/* Entities */}
      {analysis.entities && analysis.entities.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Entities ({analysis.entities.length})</h3>
            <button
              onClick={() => copyToClipboard(
                analysis.entities!.map(e => `${e.name} (${e.type}): ${e.description}`).join('\n'),
                'entities'
              )}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {copiedText === 'entities' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedText === 'entities' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.entities.map((entity, index) => (
              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-blue-900">{entity.name}</h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {entity.type}
                  </span>
                </div>
                <p className="text-sm text-blue-800">{entity.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Relationships */}
      {analysis.relationships && analysis.relationships.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Relationships ({analysis.relationships.length})</h3>
            <button
              onClick={() => copyToClipboard(
                analysis.relationships!.map(r => `${r.from} --[${r.type}]--> ${r.to}`).join('\n'),
                'relationships'
              )}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {copiedText === 'relationships' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedText === 'relationships' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="space-y-2">
            {analysis.relationships.map((rel, index) => (
              <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium text-green-900">{rel.from}</span>
                  <span className="text-green-600">--[</span>
                  <span className="font-medium text-green-700">{rel.type}</span>
                  <span className="text-green-600">]--&gt;</span>
                  <span className="font-medium text-green-900">{rel.to}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline */}
      {analysis.timeline && analysis.timeline.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Timeline ({analysis.timeline.length} events)</h3>
            <button
              onClick={() => copyToClipboard(
                analysis.timeline!.map(t => `${t.order}. ${t.event}`).join('\n'),
                'timeline'
              )}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {copiedText === 'timeline' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedText === 'timeline' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="space-y-3">
            {analysis.timeline
              .sort((a, b) => a.order - b.order)
              .map((event, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {event.order}
                  </div>
                  <p className="text-sm text-purple-800">{event.event}</p>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Themes */}
      {analysis.themes && analysis.themes.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Themes</h3>
            <button
              onClick={() => copyToClipboard(analysis.themes!.join('\n'), 'themes')}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {copiedText === 'themes' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedText === 'themes' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.themes.map((theme, index) => (
              <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                {theme}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {getAnalysisTypeLabel(analysis.type)}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 mt-1 space-y-1 sm:space-y-0">
              <div className="flex items-center space-x-1">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{analysis.scriptInfo.fileName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{formatDate(analysis.createdAt)}</span>
              </div>
              <span>{analysis.scriptInfo.textLength.toLocaleString()} characters</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2 transition-all duration-200 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          {analysis.type === 'style-dna' ? renderStyleDNA() : renderKnowledgeGraph()}
        </div>
      </div>

    </div>
  );
}

// Helper function to convert legacy Style DNA format to new format
function convertLegacyToNewStyleDNA(analysis: AnalysisItem): StyleDNA {
  return {
    id: analysis.id || '',
    userId: '',
    projectId: '',
    scriptId: '',
    voice: analysis.voice || [],
    themes: analysis.themes || [],
    characters: analysis.characters || [],
    narrative: analysis.narrative || [],
    dialog: analysis.dialog || [],
    strengths: analysis.strengths || [],
    examples: analysis.examples || [],
    confidence: analysis.confidence || 0,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
    thematicVoice: {
      mainThemes: analysis.themes || [],
      thematicVoice: 'General thematic voice',
      messagePhilosophy: []
    },
    dialogueStyle: {
      type: 'realistis',
      pace: 'moderate',
      humor: 'moderate',
      characteristics: analysis.voice || []
    },
    characterization: {
      protagonistType: 'underdog',
      characterDepth: 'moderate',
      relationshipPatterns: analysis.characters || []
    },
    worldBuilding: {
      type: 'urban_realism',
      atmosphere: [],
      culturalElements: []
    },
    toneMood: {
      primaryTone: 'dramatic',
      moodShifts: []
    },
    narrativeStructure: {
      type: 'linear',
      pacing: 'moderate'
    },
    visualSymbolism: {
      recurringImages: [],
      symbols: [],
      colorPalette: []
    },
    pacing: {
      type: 'balanced',
      conflictEscalation: 'gradual'
    },
    genrePreferences: {
      primaryGenre: 'drama',
      genreBlends: []
    },
    messagePhilosophy: {
      corePhilosophy: 'humanisme',
      coreMessages: []
    },
    analysis: {
      confidence: analysis.confidence || 0,
      sampleSize: 1,
      analysisDate: analysis.createdAt,
      examples: analysis.examples || [],
      strengths: analysis.strengths || [],
      patterns: [],
      uniqueness: []
    },
    usage: {
      recommendedFor: [],
      strengths: analysis.strengths || [],
      considerations: [],
      adaptationNotes: []
    }
  };
}

