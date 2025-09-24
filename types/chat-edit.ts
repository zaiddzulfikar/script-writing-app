// Chat Edit Feature Types
export interface ChatMessage {
  id: string;
  projectId: string;
  episodeId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  editedAt?: Date;
  isEdited: boolean;
  originalMessageId?: string; // For edited messages
  metadata?: {
    scriptGenerated?: boolean;
    thinkingSteps?: string[];
    confidenceScore?: number;
    styleDNAUsed?: boolean;
    knowledgeGraphUsed?: boolean;
  };
  // Optimized for Firebase free tier
  status: 'active' | 'deleted' | 'muted';
  threadPosition: number; // Position in conversation thread
  parentMessageId?: string; // For response chains
}

export interface MessageEdit {
  id: string;
  messageId: string;
  userId: string;
  timestamp: Date;
  oldContent: string;
  newContent: string;
  deletedResponseIds: string[]; // IDs of responses that were deleted
  contextContinuity: {
    messagesBeforeEdit: number;
    messagesAfterEdit: number;
    tokenCount: number;
  };
}

export interface ChatThread {
  id: string;
  projectId: string;
  episodeId: string;
  userId: string;
  messages: string[]; // Array of message IDs in order
  lastActivity: Date;
  isActive: boolean;
  editCount: number; // Track total edits for optimization
}

export interface AuditLog {
  id: string;
  projectId: string;
  episodeId: string;
  userId: string;
  action: 'edit_message' | 'delete_responses' | 'regenerate_response';
  timestamp: Date;
  details: {
    messageId: string;
    oldMessageId?: string;
    newMessageId?: string;
    deletedMessageIds: string[];
    editReason?: string;
  };
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };
}

// Optimized batch operations
export interface BatchOperation {
  type: 'update' | 'delete' | 'create';
  collection: string;
  docId: string;
  data?: any;
  merge?: boolean;
}

export interface EditMessageRequest {
  messageId: string;
  newContent: string;
  editReason?: string;
  preserveContext?: boolean; // Default: true
  regenerateResponse?: boolean; // Default: true
}

export interface EditMessageResponse {
  success: boolean;
  editedMessage: ChatMessage;
  newResponse?: ChatMessage;
  deletedMessageIds: string[];
  auditLogId: string;
  contextContinuity: {
    messagesInContext: number;
    tokenCount: number;
    confidenceScore: number;
  };
}
