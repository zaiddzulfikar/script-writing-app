import { NextRequest, NextResponse } from 'next/server';
import { ChatEditService } from '@/lib/firestore-chat-edit';
import type { EditMessageRequest } from '@/types/chat-edit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, newContent, editReason, preserveContext, regenerateResponse } = body as EditMessageRequest;
    
    // Validate request
    if (!messageId || !newContent) {
      return NextResponse.json(
        { error: 'Message ID and new content are required' },
        { status: 400 }
      );
    }

    // Get user ID from request (implement your auth logic here)
    const userId = request.headers.get('x-user-id') || 'anonymous';
    
    // Get project and episode IDs from request
    const projectId = request.headers.get('x-project-id');
    const episodeId = request.headers.get('x-episode-id');
    
    if (!projectId || !episodeId) {
      return NextResponse.json(
        { error: 'Project ID and Episode ID are required' },
        { status: 400 }
      );
    }

    // Edit message
    const result = await ChatEditService.editMessage(
      {
        messageId,
        newContent,
        editReason,
        preserveContext: preserveContext ?? true,
        regenerateResponse: regenerateResponse ?? true
      },
      userId,
      projectId,
      episodeId
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    );
  }
}

