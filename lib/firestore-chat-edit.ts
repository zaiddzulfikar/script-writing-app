import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection,
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  ChatMessage, 
  MessageEdit, 
  ChatThread, 
  AuditLog, 
  BatchOperation,
  EditMessageRequest,
  EditMessageResponse
} from '@/types/chat-edit';

// Collections
const MESSAGES_COLLECTION = 'chat_messages';
const MESSAGE_EDITS_COLLECTION = 'message_edits';
const CHAT_THREADS_COLLECTION = 'chat_threads';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

export class ChatEditService {
  // 1. Edit Message with Context Continuity
  static async editMessage(
    request: EditMessageRequest,
    userId: string,
    projectId: string,
    episodeId: string
  ): Promise<EditMessageResponse> {
    const batch = writeBatch(db);
    const operations: BatchOperation[] = [];
    
    try {
      // Step 1: Get original message and thread context
      const originalMessage = await this.getMessage(request.messageId);
      if (!originalMessage) {
        throw new Error('Message not found');
      }

      // Step 2: Get thread context (messages before edit)
      const threadContext = await this.getThreadContext(
        projectId, 
        episodeId, 
        originalMessage.threadPosition
      );

      // Step 3: Mark original message as edited and responses as deleted
      const editedMessage: ChatMessage = {
        ...originalMessage,
        content: request.newContent,
        editedAt: new Date(),
        isEdited: true,
        originalMessageId: originalMessage.id,
        status: 'active'
      };

      // Step 4: Get responses to delete (messages after original)
      const responsesToDelete = await this.getResponsesAfterMessage(
        projectId,
        episodeId,
        originalMessage.threadPosition
      );

      // Step 5: Prepare batch operations
      operations.push({
        type: 'update',
        collection: MESSAGES_COLLECTION,
        docId: originalMessage.id,
        data: editedMessage,
        merge: true
      });

      // Mark responses as deleted (soft delete for audit)
      responsesToDelete.forEach(response => {
        operations.push({
          type: 'update',
          collection: MESSAGES_COLLECTION,
          docId: response.id,
          data: { status: 'deleted', deletedAt: serverTimestamp() },
          merge: true
        });
      });

      // Step 6: Create audit log
      const auditLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        episodeId,
        userId,
        action: 'edit_message',
        timestamp: new Date(),
        details: {
          messageId: originalMessage.id,
          oldMessageId: originalMessage.id,
          newMessageId: originalMessage.id, // Same ID, updated content
          deletedMessageIds: responsesToDelete.map(r => r.id),
          editReason: request.editReason
        },
        metadata: {
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId()
        }
      };

      operations.push({
        type: 'create',
        collection: AUDIT_LOGS_COLLECTION,
        docId: auditLog.id,
        data: auditLog
      });

      // Step 7: Execute batch operations
      await this.executeBatchOperations(batch, operations);

      // Step 8: Generate new response if requested
      let newResponse: ChatMessage | undefined;
      if (request.regenerateResponse !== false) {
        newResponse = await this.generateNewResponse(
          editedMessage,
          threadContext,
          userId,
          projectId,
          episodeId
        );
      }

      return {
        success: true,
        editedMessage,
        newResponse,
        deletedMessageIds: responsesToDelete.map(r => r.id),
        auditLogId: auditLog.id,
        contextContinuity: {
          messagesInContext: threadContext.length,
          tokenCount: this.calculateTokenCount(threadContext),
          confidenceScore: 0.9 // High confidence for edited messages
        }
      };

    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  // 2. Get Message
  private static async getMessage(messageId: string): Promise<ChatMessage | null> {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ChatMessage;
    }
    return null;
  }

  // 3. Get Thread Context (messages before edit)
  private static async getThreadContext(
    projectId: string,
    episodeId: string,
    threadPosition: number
  ): Promise<ChatMessage[]> {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('projectId', '==', projectId),
      where('episodeId', '==', episodeId),
      where('status', '==', 'active'),
      where('threadPosition', '<=', threadPosition),
      orderBy('threadPosition', 'asc'),
      limit(10) // Limit for token optimization
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
  }

  // 4. Get Responses After Message
  private static async getResponsesAfterMessage(
    projectId: string,
    episodeId: string,
    threadPosition: number
  ): Promise<ChatMessage[]> {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('projectId', '==', projectId),
      where('episodeId', '==', episodeId),
      where('status', '==', 'active'),
      where('threadPosition', '>', threadPosition),
      orderBy('threadPosition', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
  }

  // 5. Generate New Response
  private static async generateNewResponse(
    editedMessage: ChatMessage,
    threadContext: ChatMessage[],
    userId: string,
    projectId: string,
    episodeId: string
  ): Promise<ChatMessage> {
    // Import Gemini service
    const { generateScriptResponse, generateGeneralResponse } = await import('./gemini');
    
    // Build context for Gemini
    const context = await this.buildContextForGemini(threadContext, projectId, episodeId);
    
    // Determine if it's a script request
    const isScriptRequest = this.isScriptWritingRequest(editedMessage.content);
    
    // Generate response with enhanced long script support
    // Use same logic as ChatInterface for consistency
    const responseContent = isScriptRequest 
      ? await generateScriptResponse(
          editedMessage.content, 
          context, 
          { knowledgeGraph: false, styleDNA: false, openMode: false }, // Match ChatInterface format
          false, // deepThinkEnabled
          (step: string) => {
            console.log(`Edit Message - ${step}`);
          }
        )
      : await generateGeneralResponse(editedMessage.content, context);

    // Create new response message
    const newResponse: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      episodeId,
      userId: 'assistant', // AI response
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      isEdited: false,
      status: 'active',
      threadPosition: editedMessage.threadPosition + 1,
      parentMessageId: editedMessage.id,
      metadata: {
        scriptGenerated: isScriptRequest,
        confidenceScore: 0.9
      }
    };

    // Save new response
    await setDoc(doc(db, MESSAGES_COLLECTION, newResponse.id), newResponse);
    
    return newResponse;
  }

  // 6. Build Context for Gemini
  private static async buildContextForGemini(
    threadContext: ChatMessage[],
    projectId: string,
    episodeId: string
  ): Promise<any> {
    // Get project and episode data
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    const episodeDoc = await getDoc(doc(db, 'episodes', episodeId));
    
    const project = projectDoc.exists() ? { id: projectDoc.id, ...projectDoc.data() } as any : null;
    const episode = episodeDoc.exists() ? { id: episodeDoc.id, ...episodeDoc.data() } as any : null;
    
    // Check if this is first generation (no assistant messages and no script)
    const hasNoScript = !episode?.script;
    const hasNoAssistantMessages = !threadContext.some(msg => msg.role === 'assistant');
    const isFirstGeneration = hasNoScript && hasNoAssistantMessages;
    
    return {
      project,
      currentEpisode: episode,
      recentMessages: threadContext.slice(-5), // Last 5 messages for context
      previousEpisodes: [], // Can be populated if needed
      styleDNA: null, // Can be fetched if needed
      knowledgeGraph: null, // Can be fetched if needed
      isFirstGeneration // Add flag for first generation detection
    };
  }

  // 7. Execute Batch Operations
  private static async executeBatchOperations(
    batch: any,
    operations: BatchOperation[]
  ): Promise<void> {
    operations.forEach(op => {
      const docRef = doc(db, op.collection, op.docId);
      
      switch (op.type) {
        case 'create':
          batch.set(docRef, op.data);
          break;
        case 'update':
          if (op.merge) {
            batch.update(docRef, op.data);
          } else {
            batch.set(docRef, op.data);
          }
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });

    await batch.commit();
  }

  // 8. Utility Functions
  private static isScriptWritingRequest(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Strong scriptwriting indicators (must be present)
    const strongScriptKeywords = [
      'buatkan script', 'buat script', 'tulis script', 'generate script',
      'buatkan naskah', 'buat naskah', 'tulis naskah', 'generate naskah',
      'buatkan episode', 'buat episode', 'tulis episode', 'generate episode',
      'buatkan scene', 'buat scene', 'tulis scene', 'generate scene',
      'buatkan adegan', 'buat adegan', 'tulis adegan', 'generate adegan',
      'buatkan dialog', 'buat dialog', 'tulis dialog', 'generate dialog',
      'screenplay', 'format script', 'script format', 'naskah format',
      'lanjutkan cerita', 'lanjutkan script', 'lanjutkan naskah', 'lanjutkan episode',
      'lanjut cerita', 'lanjut script', 'lanjut naskah', 'lanjut episode',
      'lanjutkan', 'lanjut', 'continue', 'melanjutkan', 'teruskan',
      'opening scene', 'scene pembuka', 'adegan pembuka', 'scene pertama',
      'scene awal', 'scene opening', 'pembuka episode', 'awal episode',
      'scene kuat', 'scene menarik', 'scene engaging', 'scene dramatis',
      // Long script detection keywords
      '80', '100', '120', 'halaman', 'panjang', 'full', 'lengkap',
      '32000', '32,000', '32k', 'kata', 'words'
    ];
    
    // Check for strong indicators first
    if (strongScriptKeywords.some(keyword => lowerContent.includes(keyword))) {
      return true;
    }
    
    // Medium scriptwriting indicators (need context)
    const mediumScriptKeywords = [
      'scene heading', 'slugline', 'action line', 'parenthetical',
      'montage', 'voice over', 'narasi', 'monolog', 'o.s.', 'v.o.',
      'cont\'d', 'beat', 'super:', 'cut to:', 'dissolve to:',
      '3-act structure', 'character arc', 'story arc', 'climax', 'resolution'
    ];
    
    // Check for medium indicators with context
    if (mediumScriptKeywords.some(keyword => lowerContent.includes(keyword))) {
      return true;
    }
    
    // Basic script keywords (fallback)
    const basicScriptKeywords = [
      'script', 'naskah', 'episode', 'scene', 'adegan', 'dialog'
    ];
    
    return basicScriptKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private static calculateTokenCount(messages: ChatMessage[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  private static getSessionId(): string {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('chat_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('chat_session_id', sessionId);
    }
    return sessionId;
  }

}
