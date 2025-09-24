"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Palette, Network, Sparkles, Eye, Trash2 } from 'lucide-react';
import { KnowledgeGraph } from '@/types/database';
import { StyleDNA, StyleDNAAnalysisRequest } from '@/types/style-dna';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { styleDNAAnalyzer } from '@/lib/style-dna-analyzer';
import StyleDNAViewer from './StyleDNAViewer';

interface Script {
  id: string;
  fileName: string;
  extractedText: string;
  textLength: number;
  createdAt: string;
}

interface ScriptAnalysisProps {
  projectId: string;
  scripts: Script[];
  onScriptsUpdate: () => void;
}

export default function ScriptAnalysis({ projectId, scripts, onScriptsUpdate }: ScriptAnalysisProps) {
  const { user } = useAuth();
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [analysisType, setAnalysisType] = useState<'style-dna' | 'knowledge-graph' | 'both' | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({
    step: '',
    percentage: 0,
    details: ''
  });
  const [results, setResults] = useState<{
    styleDNA?: StyleDNA;
    knowledgeGraph?: KnowledgeGraph;
  }>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedScript || !analysisType || !user?.id) return;

    setLoading(true);
    setResults({});
    setShowResults(false);

    try {
      // Read script text from Firestore
      const scriptSnap = await getDoc(doc(db, 'scripts', selectedScript.id));
      if (!scriptSnap.exists()) {
        throw new Error('Script not found');
      }
      const scriptData: any = scriptSnap.data();
      const extractedText: string = scriptData.extractedText || '';
      if (extractedText.length < 100) {
        throw new Error('Teks naskah terlalu pendek untuk dianalisis');
      }

      // Call server API routes to analyze (no client API key)

      if (analysisType === 'style-dna' || analysisType === 'both') {
        setAnalysisProgress({
          step: 'Analyzing Style DNA...',
          percentage: analysisType === 'both' ? 25 : 50,
          details: 'Extracting comprehensive writing style characteristics...'
        });

        // Use new Style DNA Analyzer
        const request: StyleDNAAnalysisRequest = {
          scriptText: extractedText,
          projectId,
          userId: user.id,
          analysisDepth: 'comprehensive',
          includeExamples: true,
          includeRecommendations: true
        };

        const result = await styleDNAAnalyzer.analyzeScript(request);
        
        // Save to Firestore
        const styleDNARecord = {
          ...result.styleDNA,
          userId: user.id,
          projectId: projectId,
          scriptId: selectedScript.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await addDoc(collection(db, 'styleDNA'), styleDNARecord);

        setResults(prev => ({ ...prev, styleDNA: result.styleDNA }));
      }

      if (analysisType === 'knowledge-graph' || analysisType === 'both') {
        setAnalysisProgress({
          step: 'Analyzing Knowledge Graph...',
          percentage: analysisType === 'both' ? 75 : 50,
          details: 'Extracting entities and relationships...'
        });

        const kgPrompt = `Analisis script berikut dan buat Knowledge Graph yang mendalam. Berikan response dalam format JSON dengan struktur berikut:

{
  "entities": [
    { "name": "string", "type": "Person|Location|Event|Object|Concept", "description": "string" }
  ],
  "relationships": [
    { "from": "string", "to": "string", "type": "string" }
  ],
  "timeline": [
    { "event": "string", "order": number }
  ],
  "themes": ["array of main themes"]
}

Script untuk dianalisis:
${extractedText.substring(0, 8000)} // Limit to 8000 chars

Instruksi:
1. Identifikasi entitas penting, relasi, timeline, tema
2. Nama entitas konsisten, deskripsi jelas, tipe relasi bermakna
3. Jawab dalam bahasa Indonesia.`;

        // Use direct Gemini integration for Knowledge Graph
        const { GoogleGenerativeAI: KGGoogleGenerativeAI } = await import('@google/generative-ai');
        const kgApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!kgApiKey || kgApiKey === 'your_gemini_api_key_here') {
          throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.');
        }
        const kgGenAI = new KGGoogleGenerativeAI(kgApiKey);
        const kgModel = kgGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const kgResult = await kgModel.generateContent(kgPrompt);
        const kgResponse = await kgResult.response;
        const kgResponseText = kgResponse.text();
        
        // Parse JSON response
        const kgJsonMatch = kgResponseText.match(/\{[\s\S]*\}/);
        if (!kgJsonMatch) {
          throw new Error('No JSON object found in Knowledge Graph response');
        }
        
        const knowledgeGraphData = JSON.parse(kgJsonMatch[0]);
        const cleanedKnowledgeGraph = {
          entities: Array.isArray(knowledgeGraphData.entities) ? knowledgeGraphData.entities : [],
          relationships: Array.isArray(knowledgeGraphData.relationships) ? knowledgeGraphData.relationships : [],
          timeline: Array.isArray(knowledgeGraphData.timeline) ? knowledgeGraphData.timeline : [],
          themes: Array.isArray(knowledgeGraphData.themes) ? knowledgeGraphData.themes : []
        };

        // Save to Firestore
        const kgRecord = {
          ...cleanedKnowledgeGraph,
          userId: user.id,
          projectId: projectId,
          scriptId: selectedScript.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await addDoc(collection(db, 'knowledgeGraphs'), kgRecord);

        setResults(prev => ({ ...prev, knowledgeGraph: cleanedKnowledgeGraph as KnowledgeGraph }));
      }

      setAnalysisProgress({
        step: 'Analysis Complete!',
        percentage: 100,
        details: 'Analysis results generated successfully'
      });

      setTimeout(() => {
        setShowResults(true);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Analysis error:', error);
      setLoading(false);
      
      // Better error handling with user-friendly messages
      let errorMessage = 'Failed to analyze script. ';
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage += 'Please configure your Gemini API key in environment variables.';
        } else if (error.message.includes('quota')) {
          errorMessage += 'API quota exceeded. Please try again later.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Please check your connection.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      alert(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Script Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Select Script for Analysis
        </h3>
        
        {scripts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No scripts available for analysis. Please upload a script first.
          </p>
        ) : (
          <div className="space-y-3">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                  selectedScript?.id === script.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedScript(script)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{script.fileName}</h4>
                    <p className="text-sm text-gray-500">
                      {script.textLength.toLocaleString()} characters • {formatDate(script.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {Math.round(script.textLength / 1000)}k chars
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Analysis Type Selection */}
      {selectedScript && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Choose Analysis Type
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setAnalysisType('style-dna')}
              className={`p-4 border rounded-lg text-left transition-colors ${
                analysisType === 'style-dna'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <Palette className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium">Style DNA</span>
              </div>
              <p className="text-sm text-gray-600">
                Analyze writing style, dialogue characteristics, and narrative techniques
              </p>
            </button>

            <button
              onClick={() => setAnalysisType('knowledge-graph')}
              className={`p-4 border rounded-lg text-left transition-colors ${
                analysisType === 'knowledge-graph'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <Network className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium">Knowledge Graph</span>
              </div>
              <p className="text-sm text-gray-600">
                Extract entities, relationships, and timeline events
              </p>
            </button>

            <button
              onClick={() => setAnalysisType('both')}
              className={`p-4 border rounded-lg text-left transition-colors ${
                analysisType === 'both'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium">Both Analyses</span>
              </div>
              <p className="text-sm text-gray-600">
                Generate Style DNA and Knowledge Graph together
              </p>
            </button>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleAnalyze}
              disabled={loading || !analysisType}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Analyzing...
                </div>
              ) : (
                `Start ${analysisType === 'both' ? 'Both Analyses' : analysisType === 'style-dna' ? 'Style DNA Analysis' : 'Knowledge Graph Analysis'}`
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Analysis Progress */}
      {loading && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {analysisProgress.step}
              </h3>
              <span className="text-sm text-gray-500">
                {analysisProgress.percentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analysisProgress.percentage}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-600">
              {analysisProgress.details}
            </p>
          </div>
        </Card>
      )}

      {/* Results */}
      {showResults && (
        <div className="space-y-6">
          {results.styleDNA && (
            <div className="space-y-6">
              {/* Complete Style DNA Analysis */}
              <StyleDNAViewer 
                styleDNA={results.styleDNA} 
                onClose={() => {}} // No close function needed in main view
                showActions={false}
              />
            </div>
          )}

          {results.knowledgeGraph && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Network className="h-5 w-5 mr-2 text-green-600" />
                Knowledge Graph
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Entitas ({results.knowledgeGraph.entities.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.knowledgeGraph.entities.map((entity, index) => (
                      <div key={index} className="p-3 bg-gray-25 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{entity.name}</span>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            {entity.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{entity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeline ({results.knowledgeGraph.timeline.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.knowledgeGraph.timeline
                      .sort((a, b) => a.order - b.order)
                      .map((event, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {event.order}
                          </div>
                          <p className="text-sm text-gray-700">{event.event}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {results.knowledgeGraph.relationships.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Hubungan ({results.knowledgeGraph.relationships.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {results.knowledgeGraph.relationships.map((rel, index) => (
                      <div key={index} className="p-2 bg-gray-25 rounded text-sm">
                        <span className="font-medium text-gray-900">{rel.from}</span>
                        <span className="mx-2 text-gray-500">→</span>
                        <span className="font-medium text-gray-900">{rel.to}</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {rel.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.knowledgeGraph.themes.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Tema Utama</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.knowledgeGraph.themes.map((theme, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
