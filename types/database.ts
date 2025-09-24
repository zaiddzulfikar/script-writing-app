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
  editedAt?: Date;
  isEdited?: boolean;
  originalMessageId?: string;
  status?: 'active' | 'deleted' | 'muted';
  threadPosition?: number;
  parentMessageId?: string;
  metadata?: {
    scriptGenerated?: boolean;
    contextUsed?: string[];
    thinkingSteps?: string[];
    confidenceScore?: number;
    styleDNAUsed?: boolean;
    knowledgeGraphUsed?: boolean;
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
