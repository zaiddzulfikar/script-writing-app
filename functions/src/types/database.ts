export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  genre: string;
  totalEpisodes: number;
  synopsis: string;
  tone: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Episode {
  id: string;
  projectId: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  setting: string;
  script?: string;
  minPages?: number; // minimum number of pages for script generation
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  episodeId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    scriptGenerated?: boolean;
    contextUsed?: string[];
  };
}

export interface ScriptVersion {
  id: string;
  episodeId: string;
  version: number;
  content: string;
  createdAt: Date;
  createdBy: 'user' | 'ai';
}



export interface ScriptUpload {
  id: string;
  userId: string;
  projectId: string;
  fileName: string;
  fileContent: string;
  fileSize: number;
  uploadDate: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  writerName?: string;
  downloadURL?: string;
}

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
}

export interface KnowledgeGraph {
  id: string;
  userId: string;
  projectId: string;
  scriptId: string;
  entities: {
    name: string;
    type: string;
    description: string;
  }[];
  relationships: {
    from: string;
    to: string;
    type: string;
  }[];
  timeline: {
    event: string;
    order: number;
  }[];
  themes: string[];
  createdAt: Date;
  updatedAt: Date;
}
