export interface StyleDNA {
  id: string;
  userId: string;
  projectId: string;
  scriptId: string;
  voice: string[];
  themes: string[];
  characters: string[];
  narrative: string[];
  dialog: string[];
  strengths: string[];
  examples: string[];
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  thematicVoice?: {
    mainThemes: string[];
    thematicVoice: string;
    messagePhilosophy: string[];
  };
  dialogueStyle?: {
    type: string;
    pace: string;
    humor: string;
    characteristics: string[];
  };
  characterization?: {
    protagonistType: string;
    characterDepth: string;
    relationshipPatterns: string[];
  };
  worldBuilding?: {
    type: string;
    atmosphere: string[];
    culturalElements: string[];
  };
  toneMood?: {
    primaryTone: string;
    moodShifts: string[];
  };
  narrativeStructure?: {
    type: string;
    pacing: string;
  };
  visualSymbolism?: {
    recurringImages: string[];
    symbols: string[];
    colorPalette: string[];
  };
  pacing?: {
    type: string;
    conflictEscalation: string;
  };
  genrePreferences?: {
    primaryGenre: string;
    genreBlends: string[];
  };
  messagePhilosophy?: {
    corePhilosophy: string;
    coreMessages: string[];
  };
  analysis?: {
    confidence: number;
    sampleSize: number;
    analysisDate: Date;
    examples: string[];
    strengths: string[];
    patterns: string[];
    uniqueness: string[];
  };
  usage?: {
    recommendedFor: string[];
    strengths: string[];
    considerations: string[];
    adaptationNotes: string[];
  };
}

export interface StyleDNAAnalysisRequest {
  scriptText: string;
  projectId: string;
  userId: string;
  analysisDepth: 'basic' | 'comprehensive' | 'deep';
  includeExamples: boolean;
  includeRecommendations: boolean;
}

export interface StyleDNAGenerationOptions {
  focusAreas?: string[];
  depth?: 'basic' | 'comprehensive' | 'deep';
  includeExamples?: boolean;
  includeRecommendations?: boolean;
  adaptationMode?: 'flexible' | 'strict' | 'creative';
  intensity?: number;
  preserveOriginal?: boolean;
}

export interface StyleDNAAnalysisResult {
  styleDNA: StyleDNA;
  analysisReport: {
    confidence: number;
    sampleSize: number;
    analysisDate: Date;
    processingTime: number;
    quality: 'low' | 'medium' | 'high';
  };
  recommendations?: string[];
  examples?: string[];
}

export interface StyleDNAValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number;
}
