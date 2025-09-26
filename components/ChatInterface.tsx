'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, 
  Loader2, 
  Download, 
  Save, 
  Copy, 
  Edit3,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Brain,
  Network,
  Palette,
  Globe
} from 'lucide-react'
import ScriptMetadata from './ScriptMetadata'
import MessageEditor from './MessageEditor'
import ScriptEditModal from './ScriptEditModal'
import StyleDNASelectorModal from './StyleDNASelectorModal'
import toast from 'react-hot-toast'
import { Project, Episode, ChatMessage } from '@/types/database'
import type { EditMessageRequest } from '@/types/chat-edit'
import { generateScriptResponse, generateFallbackScript, generateGeneralResponse, parseScriptContinuationResponse, generateAdvancedScriptGeneration } from '@/lib/gemini'

// Memoized component for script messages to prevent hook issues
const ScriptMessage = memo(({ 
  message, 
  episode, 
  copyToClipboard, 
  downloadScript, 
  setEditingScriptId, 
  setEditingScriptContent, 
  setShowScriptEditModal,
  styleDNA
}: {
  message: ChatMessage;
  episode: Episode;
  copyToClipboard: (text: string) => void;
  downloadScript: (content: string) => void;
  setEditingScriptId: (id: string) => void;
  setEditingScriptContent: (content: string) => void;
  setShowScriptEditModal: (show: boolean) => void;
  styleDNA?: any;
}) => {
  const parsed = useMemo(() => {
    return parseScriptContinuationResponse(message.content);
  }, [message.content]);
  

  const handleEdit = useCallback(() => {
    const content = parsed.continuation || message.content;
    setEditingScriptId(message.id);
    setEditingScriptContent(content);
    setShowScriptEditModal(true);
  }, [parsed.continuation, message.content, message.id, setEditingScriptId, setEditingScriptContent, setShowScriptEditModal]);

  return (
    <div className="space-y-4">
      {/* Show Script Analysis UI only for script-related responses */}
      {parsed.metadata ? (
        <ScriptMetadata 
          metadata={parsed.metadata} 
          recap={parsed.recap || undefined}
          styleDNA={styleDNA}
        />
      ) : (
        <ScriptMetadata 
          metadata={{
            episode_number: episode.episodeNumber,
            last_scene_id: "SCENE_1",
            last_scene_summary: "Script analysis sedang berjalan...",
            main_characters: ["Karakter Utama"],
            current_tone_style: "Drama",
            open_threads: ["Plot utama"],
            assumptions_made: ["Analisis sedang dilakukan"],
            confidence_score: 0.8,
            style_dna_used: "Script Analysis aktif"
          }} 
          recap="Script Analysis UI untuk response script"
          styleDNA={styleDNA}
        />
      )}
      
      <div data-message-id={message.id}>
        <ScriptRenderer
          content={parsed.continuation || message.content}
          episodeTitle={episode.title}
          onCopy={copyToClipboard}
          onDownload={downloadScript}
          onEdit={handleEdit}
          canEdit={true}
        />
      </div>
    </div>
  );
});

ScriptMessage.displayName = 'ScriptMessage';
import ScriptRenderer from '@/components/ScriptRenderer'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  onSnapshot,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface ChatInterfaceProps {
  project: Project
  episode: Episode
}

export default function ChatInterface({ project, episode }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(true)
  const [activeModes, setActiveModes] = useState<{
    deepThink: boolean;
    knowledgeGraph: boolean;
    styleDNA: boolean;
    openMode: boolean;
  }>({
    deepThink: false,
    knowledgeGraph: false,
    styleDNA: false,
    openMode: false
  })
  const [deepThinkEnabled, setDeepThinkEnabled] = useState<boolean>(false)
  const [isThinking, setIsThinking] = useState<boolean>(false)
  const [thinkingStep, setThinkingStep] = useState<string>('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null)
  const [editingScriptContent, setEditingScriptContent] = useState<string>('')
  const [showScriptEditModal, setShowScriptEditModal] = useState(false)
  const [isEditingScript, setIsEditingScript] = useState(false)
  const [currentStyleDNA, setCurrentStyleDNA] = useState<any>(null)
  const [availableStyleDNAs, setAvailableStyleDNAs] = useState<any[]>([])
  const [showStyleDNASelector, setShowStyleDNASelector] = useState(false)
  const [selectedStyleDNA, setSelectedStyleDNA] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const toggleMode = (mode: 'deepThink' | 'knowledgeGraph' | 'styleDNA' | 'openMode') => {
    if (mode === 'styleDNA') {
      // Check if user has multiple Style DNAs
      if (availableStyleDNAs.length > 1) {
        setShowStyleDNASelector(true)
        return
      } else if (availableStyleDNAs.length === 1) {
        // Use the only available Style DNA
        setSelectedStyleDNA(availableStyleDNAs[0])
        setCurrentStyleDNA(availableStyleDNAs[0])
      }
    }
    
    setActiveModes(prev => ({
      ...prev,
      [mode]: !prev[mode]
    }))
  }

  const handleStyleDNASelect = (styleDNA: any) => {
    setSelectedStyleDNA(styleDNA)
    setCurrentStyleDNA(styleDNA)
    setShowStyleDNASelector(false)
    setActiveModes(prev => ({
      ...prev,
      styleDNA: true
    }))
    toast.success(`Style DNA "${styleDNA.thematicVoice?.thematicVoice || 'Style DNA'}" dipilih!`)
  }

  // Function to detect if user request is about scriptwriting
  const isScriptWritingRequest = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    
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
      'scene kuat', 'scene menarik', 'scene engaging', 'scene dramatis'
    ];
    
    // Check for strong indicators first
    if (strongScriptKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true;
    }
    
    // Enhanced long script detection
    const isLongScriptRequest = (
      (lowerMessage.includes('generate') || 
       lowerMessage.includes('buat') || 
       lowerMessage.includes('tulis') ||
       lowerMessage.includes('buatkan') ||
       lowerMessage.includes('tuliskan')) &&
      (lowerMessage.includes('halaman') || 
       lowerMessage.includes('80') || 
       lowerMessage.includes('90') || 
       lowerMessage.includes('100') ||
       lowerMessage.includes('120') ||
       lowerMessage.includes('panjang') ||
       lowerMessage.includes('full') ||
       lowerMessage.includes('lengkap') ||
       lowerMessage.includes('episode'))
    );

    if (isLongScriptRequest) {
      return true;
    }

    // Enhanced context-aware detection for script requests
    const hasScriptContext = (
      lowerMessage.includes('konflik') ||
      lowerMessage.includes('hook') ||
      lowerMessage.includes('karakter') ||
      lowerMessage.includes('cerita') ||
      lowerMessage.includes('plot') ||
      lowerMessage.includes('scene') ||
      lowerMessage.includes('dialog') ||
      lowerMessage.includes('adegan')
    );

    const hasGenerationIntent = (
      lowerMessage.includes('generate') || 
      lowerMessage.includes('buat') || 
      lowerMessage.includes('tulis') ||
      lowerMessage.includes('buatkan') ||
      lowerMessage.includes('tuliskan')
    );

    if (hasGenerationIntent && hasScriptContext) {
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
    if (mediumScriptKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true;
    }
    
    // Weak indicators (need multiple or specific context)
    const weakScriptKeywords = [
      'karakter', 'plot', 'cerita', 'struktur', 'setup', 'confrontation',
      'dialogue', 'production', 'director', 'actor', 'crew', 'shooting'
    ];
    
    // Only trigger if multiple weak indicators or specific context
    const weakMatches = weakScriptKeywords.filter(keyword => lowerMessage.includes(keyword));
    if (weakMatches.length >= 2) {
      return true;
    }
    
    // Check for specific scriptwriting phrases
    const scriptPhrases = [
      'bagaimana cara menulis', 'cara membuat script', 'cara menulis naskah',
      'format penulisan script', 'struktur script', 'elemen script',
      'tutorial script', 'panduan script', 'tips script'
    ];
    
    if (scriptPhrases.some(phrase => lowerMessage.includes(phrase))) {
      return true;
    }
    
    return false;
  };

  // Function to detect if this is a general chat (not script-related)
  const isGeneralChat = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    
    // General chat indicators that should NOT show script analysis
    const generalChatKeywords = [
      'apa ibu kota', 'ibu kota', 'kota', 'negara', 'ibukota',
      'berapa', 'kapan', 'dimana', 'siapa', 'mengapa', 'kenapa',
      'bagaimana kabar', 'kabar', 'halo', 'hai', 'hi', 'hello',
      'terima kasih', 'thanks', 'makasih', 'sama-sama',
      'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
      'good morning', 'good afternoon', 'good evening', 'good night',
      'cuaca', 'weather', 'hujan', 'panas', 'dingin',
      'makanan', 'food', 'minuman', 'drink', 'restoran',
      'olahraga', 'sport', 'sepak bola', 'football', 'basket',
      'musik', 'music', 'lagu', 'song', 'band', 'grup',
      'film favorit', 'movie', 'sinema', 'cinema',
      'buku', 'book', 'novel', 'majalah', 'magazine',
      'teknologi', 'technology', 'komputer', 'computer', 'hp', 'phone',
      'internet', 'website', 'aplikasi', 'app', 'software',
      'belanja', 'shopping', 'toko', 'store', 'market',
      'perjalanan', 'travel', 'liburan', 'holiday', 'vacation',
      'keluarga', 'family', 'teman', 'friend', 'pacaran', 'dating',
      'kerja', 'work', 'pekerjaan', 'job', 'karir', 'career',
      'sekolah', 'school', 'kuliah', 'university', 'pendidikan',
      'kesehatan', 'health', 'dokter', 'doctor', 'rumah sakit',
      'uang', 'money', 'gaji', 'salary', 'harga', 'price',
      'rumah', 'house', 'apartemen', 'apartment', 'kost', 'kos'
    ];
    
    // Check if message contains general chat keywords
    if (generalChatKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true;
    }
    
    // Check for very short messages (likely general chat)
    if (message.trim().length <= 10 && !isScriptWritingRequest(message)) {
      return true;
    }
    
    return false;
  };

  // Function to detect if this is a script continuation request
  const isScriptContinuation = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    
    // Check if this is a continuation request
    const continuationKeywords = [
      'lanjutkan cerita', 'lanjutkan script', 'lanjutkan naskah', 'lanjutkan episode',
      'lanjut cerita', 'lanjut script', 'lanjut naskah', 'lanjut episode',
      'lanjutkan', 'lanjut', 'continue', 'melanjutkan', 'teruskan'
    ];
    
    return continuationKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Compact thinking indicator with separated content
  const ThinkingIndicator = ({ step }: { step: string }) => (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl shadow-sm relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-blue-100/30 to-blue-50/30 animate-pulse"></div>
      
      {/* Left side - Thinking indicator */}
      <div className="flex items-center space-x-3">
        {/* Compact animated icon */}
        <div className="flex-shrink-0">
          <div className="relative w-6 h-6 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md animate-thinking-glow">
            {/* Outer ring animation */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping"></div>
            {/* Inner dot with breathing animation */}
            <div className="w-2 h-2 bg-white rounded-full animate-thinking-pulse shadow-sm"></div>
          </div>
        </div>
        
        {/* Thinking text with dots */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Thinking
          </span>
          {/* Compact animated dots */}
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-thinking-bounce"></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-thinking-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-thinking-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </div>
      
      {/* Right side - Step content */}
      <div className="text-right">
        <span className="text-xs font-medium thinking-shimmer">{step}</span>
      </div>
    </div>
  )

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      
      // Calculate the height based on content
      const scrollHeight = textarea.scrollHeight
      const lineHeight = 20 // Approximate line height for text-sm
      const maxLines = 3
      const maxHeight = lineHeight * maxLines
      
      // Set height to content height or max height, whichever is smaller
      const newHeight = Math.min(scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    adjustTextareaHeight()
  }

  useEffect(() => {
    fetchMessages()
  }, [episode.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage])

  // Mobile performance optimization
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Reduce animation complexity on mobile
      document.documentElement.style.setProperty('--animation-duration', '0.2s')
    } else {
      document.documentElement.style.setProperty('--animation-duration', '0.3s')
    }
  }, [])

  const fetchMessages = () => {
    // Use simple query without orderBy to avoid index issues
    const q = query(
      collection(db, 'chatMessages'),
      where('episodeId', '==', episode.id)
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // Skip update if we're currently editing a script to prevent conflicts
      if (isEditingScript) {
        console.log('Skipping onSnapshot update during script edit')
        return
      }
      
      const messagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      })) as ChatMessage[]
      
      // Filter out deleted messages and sort by timestamp
      const activeMessages = messagesData
        .filter(msg => msg.status !== 'deleted')
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      
      setMessages(activeMessages)
      setLoading(false)
    }, (error) => {
      console.error('Error in messages snapshot:', error)
      setLoading(false)
    })

    return unsubscribe
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const isScriptContent = (content: string): boolean => {
    // Check if content contains script indicators
    const scriptIndicators = [
      // Title indicators
      '## CINTA SI PENJUAL GORENGAN',
      '## CINTA SI PENJUAL',
      'EPISODE',
      'Episode',
      
      // Scene indicators
      'INT.', 'EXT.', 'int.', 'ext.',
      'SCENE START', 'scene start',
      'FADE OUT', 'fade out',
      'CUT TO:', 'cut to:',
      
      // Character indicators (uppercase names without colon)
      'RANI', 'IBU RANI', 'ADRIAN', 'SULTAN',
      'BIMA', 'LARAS', 'ANAK KECIL',
      
      // Action indicators
      'SOUND:', 'sound:',
      'MUSIC:', 'music:',
      
      // General script patterns
      '**EXT.', '**INT.',
      '[SCENE', '[scene',
      'PERTEMUAN', 'GORENGAN', 'WARUNG'
    ]
    
    return scriptIndicators.some(indicator => content.includes(indicator))
  }

  const buildChatContext = async () => {
    try {
      // Get all episodes for this project
      const episodesQuery = query(
        collection(db, 'episodes'),
        where('projectId', '==', project.id)
      )
      const episodesSnapshot = await getDocs(episodesQuery)
      const allEpisodes = episodesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Episode[]
      
      // Sort episodes by episode number
      allEpisodes.sort((a, b) => a.episodeNumber - b.episodeNumber)
      
      // Get previous episodes (episodes with lower episode number)
      const previousEpisodes = allEpisodes.filter(ep => ep.episodeNumber < episode.episodeNumber)
      
      // Get all chat messages for previous episodes to get script context
      const allMessages: ChatMessage[] = []
      
      for (const prevEpisode of previousEpisodes) {
        const messagesQuery = query(
          collection(db, 'chatMessages'),
          where('episodeId', '==', prevEpisode.id),
          orderBy('timestamp', 'asc')
        )
        
        try {
          const messagesSnapshot = await getDocs(messagesQuery)
          const episodeMessages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
          })) as ChatMessage[]
          
          allMessages.push(...episodeMessages)
        } catch (error) {
          // If orderBy fails, try without it
          const simpleQuery = query(
            collection(db, 'chatMessages'),
            where('episodeId', '==', prevEpisode.id)
          )
          const messagesSnapshot = await getDocs(simpleQuery)
          const episodeMessages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
          })) as ChatMessage[]
          
          episodeMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          allMessages.push(...episodeMessages)
        }
      }
      
      // Add current episode messages
      allMessages.push(...messages)

      // Get Style DNA and Knowledge Graph for this project
      let styleDNA = null
      let knowledgeGraph = null

      try {
        // Get latest Style DNA for this project
        const styleDNAQuery = query(
          collection(db, 'styleDNA'),
          where('projectId', '==', project.id)
        )
        const styleDNASnapshot = await getDocs(styleDNAQuery)
        if (!styleDNASnapshot.empty) {
          // Get all Style DNAs
          const styleDNAs = styleDNASnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate()
          })) as any[]
          styleDNAs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          
          // Set available Style DNAs for selection
          setAvailableStyleDNAs(styleDNAs)
          
          // Use the most recent Style DNA by default
          styleDNA = styleDNAs[0]
        }

        // Get latest Knowledge Graph for this project
        const knowledgeGraphQuery = query(
          collection(db, 'knowledgeGraphs'),
          where('projectId', '==', project.id)
        )
        const knowledgeGraphSnapshot = await getDocs(knowledgeGraphQuery)
        if (!knowledgeGraphSnapshot.empty) {
          // Get the most recent Knowledge Graph
          const knowledgeGraphs = knowledgeGraphSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate()
          })) as any[]
          knowledgeGraphs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          knowledgeGraph = knowledgeGraphs[0]
        }
      } catch (error) {
        console.warn('Error fetching Style DNA or Knowledge Graph:', error)
        // Continue without Style DNA/Knowledge Graph if there's an error
      }
      
      // Set Style DNA state for UI
      setCurrentStyleDNA(styleDNA);
      
      // Debug logging
      console.log('🎨 Style DNA loaded:', styleDNA ? 'YES' : 'NO');
      if (styleDNA) {
        console.log('🎨 Style DNA details:', {
          pacing: styleDNA.pacing?.type,
          tone: styleDNA.toneMood?.primaryTone,
          genre: styleDNA.genrePreferences?.primaryGenre
        });
      }
      
      return {
        project,
        currentEpisode: episode,
        previousEpisodes,
        recentMessages: allMessages.slice(-50), // Get last 50 messages for comprehensive context
        styleDNA: selectedStyleDNA || styleDNA || undefined,
        knowledgeGraph: knowledgeGraph || undefined,
      }
    } catch (error) {
      console.error('Error building chat context:', error)
      // Fallback to basic context
      return {
        project,
        currentEpisode: episode,
        previousEpisodes: [],
        recentMessages: messages.slice(-1000), // Increased fallback context for better continuity
        styleDNA: selectedStyleDNA || currentStyleDNA, // Include selected or current Style DNA in fallback
        knowledgeGraph: undefined
      }
    }
  }

  // Edit message functionality
  const handleEditMessage = async (messageId: string, newContent: string, modes?: { deepThink: boolean; knowledgeGraph: boolean; styleDNA: boolean; openMode: boolean }) => {
    try {
      console.log('Editing message:', messageId, newContent);
      
      // Find the message to edit and get its position
      const messageToEdit = messages.find(msg => msg.id === messageId);
      if (!messageToEdit) {
        throw new Error('Message not found');
      }
      
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      // Get messages that need to be deleted (all messages after the edited one)
      const messagesToDelete = messages.slice(messageIndex + 1);
      
      // Update the edited message in database
      const messageRef = doc(db, 'chatMessages', messageId);
      await updateDoc(messageRef, {
        content: newContent,
        isEdited: true,
        editedAt: new Date()
      });
      
      // Delete all messages after the edited message from database
      for (const msg of messagesToDelete) {
        const msgRef = doc(db, 'chatMessages', msg.id);
        await updateDoc(msgRef, {
          status: 'deleted',
          deletedAt: new Date()
        });
      }
      
      setEditingMessageId(null);
      toast.success('Message updated successfully');
      
      // Generate new response using existing Gemini integration
      try {
        setIsLoading(true);
        
        // Use modes from edit if provided, otherwise use current activeModes
        const editModes = modes || activeModes;
        
        // Show thinking process if Deep Think is enabled
        if (editModes.deepThink) {
          setIsThinking(true);
          setThinkingStep('Memulai proses deep thinking...');
        }
        
        const context = {
          project,
          currentEpisode: episode,
          previousEpisodes: [], // Can be populated if needed
          recentMessages: messages.slice(0, messageIndex + 1), // Messages up to edited one
          styleDNA: currentStyleDNA, // Use current Style DNA
          knowledgeGraph: null // Can be fetched if needed
        };
        const isScriptRequest = isScriptWritingRequest(newContent);
        
        let responseContent: string;
        if (editModes.openMode) {
          // Open Mode: Pure general conversation without any script context
          responseContent = await generateGeneralResponse(newContent, context, { ...editModes, openMode: true }, (step) => {
            setThinkingStep(step);
            console.log('🧠 Deep Think Step (Open Mode):', step);
          });
        } else if (isScriptRequest) {
          responseContent = await generateScriptResponse(
            newContent, 
            context, 
            editModes,
            false,
            (step) => {
              setThinkingStep(step);
              console.log('🧠 Deep Think Step:', step);
            }
          );
        } else {
          responseContent = await generateGeneralResponse(newContent, context, editModes, (step) => {
            setThinkingStep(step);
            console.log('🧠 Deep Think Step (General):', step);
          });
        }

        // Add new AI response to database
        await addDoc(collection(db, 'chatMessages'), {
          episodeId: episode.id,
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          status: 'active',
          metadata: {
            scriptGenerated: isScriptRequest,
            openMode: editModes.openMode
          }
        });
        
      } catch (genError) {
        console.error('Error generating new response:', genError);
        toast.error('Message updated but failed to generate new response');
      } finally {
        setIsLoading(false);
        setIsThinking(false);
        setThinkingStep('');
      }
      
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to update message');
      throw error;
    }
  };

  // Edit script functionality
  const handleEditScript = async (messageId: string, newContent: string) => {
    try {
      console.log('Editing script:', messageId, newContent);
      setIsEditingScript(true); // Set flag to prevent onSnapshot conflicts
      
      // Find the message to edit and get its position
      const messageToEdit = messages.find(msg => msg.id === messageId);
      if (!messageToEdit) {
        throw new Error('Message not found');
      }
      
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      
      // Get messages that need to be deleted (all messages after the edited one)
      const messagesToDelete = messages.slice(messageIndex + 1);
      
      console.log(`Found ${messagesToDelete.length} messages to delete after edit`);
      
      // Update the edited message in database
      const messageRef = doc(db, 'chatMessages', messageId);
      await updateDoc(messageRef, {
        content: newContent,
        isEdited: true,
        editedAt: new Date()
      });
      
      // Delete all messages after the edited message from database
      for (const msg of messagesToDelete) {
        const msgRef = doc(db, 'chatMessages', msg.id);
        await updateDoc(msgRef, {
          status: 'deleted',
          deletedAt: new Date()
        });
        console.log(`Marked message ${msg.id} as deleted`);
      }

      // Update local state to remove deleted messages immediately
      setMessages(prevMessages => {
        const updatedMessages = prevMessages.slice(0, messageIndex + 1);
        console.log(`Updated local state: ${prevMessages.length} -> ${updatedMessages.length} messages`);
        return updatedMessages;
      });

      toast.success(`Script berhasil disimpan! ${messagesToDelete.length > 0 ? `${messagesToDelete.length} chat setelahnya telah dihapus untuk menjaga konsistensi.` : ''}`);
      
      // Reset flag after a short delay to allow onSnapshot to resume
      setTimeout(() => {
        setIsEditingScript(false);
        console.log('Script edit completed, onSnapshot updates resumed');
      }, 1000);
      
    } catch (error) {
      console.error('Error editing script:', error);
      toast.error('Gagal menyimpan script');
      setIsEditingScript(false); // Reset flag on error
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Mark message as deleted in database
      const messageRef = doc(db, 'chatMessages', messageId);
      await updateDoc(messageRef, {
        status: 'deleted',
        deletedAt: new Date()
      });
      
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)
    
    // Reset textarea height after sending message
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = '20px'
      }
    }, 100)

    try {
      // Add user message to database
      const userMessageDoc = await addDoc(collection(db, 'chatMessages'), {
        episodeId: episode.id,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        status: 'active'
      })

      // Get context for AI and generate contextual response
      const context = await buildChatContext()
      
      let aiResponse: string
      let isScriptGenerated = false
      
      // Detect if this is a scriptwriting request or general discussion
      const isScriptRequest = isScriptWritingRequest(userMessage);
      const isGeneralChatRequest = isGeneralChat(userMessage);
      
      // Use script analysis for script-related requests, not for general chat
      const shouldUseScriptAnalysis = isScriptRequest || (!isGeneralChatRequest);
      
      // Show thinking indicator if deep think is enabled
      if (deepThinkEnabled) {
        setIsThinking(true)
        
        // Always show script analysis thinking steps
        setThinkingStep('Menganalisis script context dan metadata...')
        
        // Add additional thinking steps for variety
        setTimeout(() => {
          setThinkingStep('Memproses context dan chat history...')
        }, 1000)
        
        setTimeout(() => {
          setThinkingStep('Menyiapkan response yang optimal...')
        }, 2000)
      }
      
      try {
        
        if (activeModes.openMode) {
          // Open Mode: Pure general conversation without any script context
          aiResponse = await generateGeneralResponse(userMessage, context, { ...activeModes, openMode: true })
          isScriptGenerated = false
        } else if (isScriptRequest || shouldUseScriptAnalysis) {
          // Use advanced script generation with analysis for ALL script-related requests
          // This ensures metadata is always generated for script requests
          aiResponse = await generateScriptResponse(userMessage, context, activeModes, false, (step: string) => {
            setThinkingStep(step)
          })
          isScriptGenerated = true
        } else {
          // For general conversation, use general response without script analysis UI
          aiResponse = await generateGeneralResponse(userMessage, context, activeModes)
          isScriptGenerated = false // Don't show Script Analysis UI for general conversation
        }
      } catch (error: any) {
        console.error('Error generating AI response:', error)
        
        // Use fallback if AI is not available
        if (error.message?.includes('quota') || error.message?.includes('429')) {
          if (isScriptRequest || shouldUseScriptAnalysis) {
            aiResponse = generateFallbackScript(episode, project)
            isScriptGenerated = true
            toast.error('AI tidak tersedia, menggunakan template default')
          } else {
            aiResponse = "Maaf, AI tidak tersedia saat ini. Silakan coba lagi nanti."
            isScriptGenerated = false
            toast.error('AI tidak tersedia, silakan coba lagi')
          }
        } else {
          throw error
        }
      }

      // Add AI response to database
      
      await addDoc(collection(db, 'chatMessages'), {
        episodeId: episode.id,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        status: 'active',
        metadata: {
          scriptGenerated: isScriptGenerated,
          openMode: activeModes.openMode,
          contextUsed: [project.id, episode.id]
        }
      })

      // Status episode hanya untuk display, tidak perlu auto-update
      // User bisa manual update status jika diperlukan

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Gagal mengirim pesan')
    } finally {
      setIsLoading(false)
      setIsThinking(false)
      setThinkingStep('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleShortcutClick = async (shortcut: string) => {
    if (isLoading) return
    
    setInputMessage(shortcut)
    setIsLoading(true)
    
    // Reset textarea height after setting message
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = '20px'
      }
    }, 100)

    try {
      // Add user message to database
      const userMessageDoc = await addDoc(collection(db, 'chatMessages'), {
        episodeId: episode.id,
        role: 'user',
        content: shortcut,
        timestamp: new Date(),
        status: 'active'
      })

      // Get context for AI and generate contextual response
      const context = await buildChatContext()
      
      let aiResponse: string
      let isScriptGenerated = false
      
      // Detect if this is a scriptwriting request or general discussion
      const isScriptRequest = isScriptWritingRequest(shortcut);
      const isGeneralChatRequest = isGeneralChat(shortcut);
      
      // Use script analysis for script-related requests, not for general chat
      const shouldUseScriptAnalysis = isScriptRequest || (!isGeneralChatRequest);
      
      // Show thinking indicator if deep think is enabled
      if (deepThinkEnabled) {
        setIsThinking(true)
        
        if (isScriptRequest) {
          // Script-specific thinking steps - will be updated by real AI thinking process
          setThinkingStep('Menganalisis context dan chat history...')
        } else {
          // General conversation thinking steps
          setThinkingStep('Menganalisis pertanyaan dan context...')
          
          setTimeout(() => {
            setThinkingStep('Mempertimbangkan berbagai perspektif...')
          }, 1000)
          
          setTimeout(() => {
            setThinkingStep('Menyiapkan jawaban yang informatif...')
          }, 2000)
        }
      }
      
      try {
        
        if (activeModes.openMode) {
          // Open Mode: Pure general conversation without any script context
          aiResponse = await generateGeneralResponse(shortcut, context, { ...activeModes, openMode: true })
          isScriptGenerated = false
        } else if (isScriptRequest || shouldUseScriptAnalysis) {
          // Use advanced script generation for scriptwriting requests (ensures metadata is included)
          aiResponse = await generateScriptResponse(shortcut, context, activeModes, false, (step: string) => {
            setThinkingStep(step)
          })
          isScriptGenerated = true // Always true for script-related requests
        } else {
          // Use general conversation for other topics
          aiResponse = await generateGeneralResponse(shortcut, context, activeModes)
          isScriptGenerated = false
        }
      } catch (error: any) {
        console.error('Error generating AI response:', error)
        
        // Use fallback if AI is not available
        if (error.message?.includes('quota') || error.message?.includes('429')) {
          if (isScriptRequest || shouldUseScriptAnalysis) {
            aiResponse = generateFallbackScript(episode, project)
            isScriptGenerated = true
            toast.error('AI tidak tersedia, menggunakan template default')
          } else {
            aiResponse = "Maaf, AI tidak tersedia saat ini. Silakan coba lagi nanti."
            isScriptGenerated = false
            toast.error('AI tidak tersedia, silakan coba lagi')
          }
        } else {
          throw error
        }
      }

      // Add AI response to database
      await addDoc(collection(db, 'chatMessages'), {
        episodeId: episode.id,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        status: 'active',
        metadata: {
          scriptGenerated: isScriptGenerated,
          openMode: activeModes.openMode,
          contextUsed: [project.id, episode.id]
        }
      })

      // Clear input after sending
      setInputMessage('')

    } catch (error) {
      console.error('Error sending shortcut message:', error)
      toast.error('Gagal mengirim pesan')
    } finally {
      setIsLoading(false)
      setIsThinking(false)
      setThinkingStep('')
    }
  }

  // Generate contextual shortcuts based on episode position
  const getContextualShortcuts = () => {
    const totalEpisodes = project.totalEpisodes || 10
    const episodeNumber = episode.episodeNumber
    const isFirstEpisode = episodeNumber === 1
    const isLastEpisode = episodeNumber === totalEpisodes
    const isMiddleEpisode = episodeNumber > 1 && episodeNumber < totalEpisodes

    // Base shortcuts that always appear
    const baseShortcuts = [
      { text: 'Lanjutkan Script', icon: '▶️', prompt: 'Lanjutkan script dari titik terakhir dengan seamless continuation' }
    ]

    if (isFirstEpisode) {
      return [
        ...baseShortcuts,
        { text: 'Buatkan opening scene', icon: '🎬', prompt: 'Buatkan script opening scene yang kuat untuk episode pertama - perkenalkan dunia cerita dan karakter utama dengan engaging' },
        { text: 'Perkenalan karakter', icon: '👥', prompt: 'Buatkan script scene perkenalan karakter utama dengan clear motivation dan goal' },
        { text: 'Setup conflict awal', icon: '⚡', prompt: 'Buatkan script scene yang setup central conflict yang akan drive seluruh cerita' },
        { text: 'Hook dramatis', icon: '🎣', prompt: 'Buatkan script scene dengan hook atau pertanyaan dramatis yang membuat audience penasaran' }
      ]
    } else if (isMiddleEpisode) {
      return [
        ...baseShortcuts,
        { text: 'Develop karakter', icon: '🎭', prompt: 'Buatkan script scene pengembangan karakter yang menambah depth dan complexity' },
        { text: 'Tingkatkan konflik', icon: '🔥', prompt: 'Buatkan script scene yang meningkatkan konflik dan menambah layer baru' },
        { text: 'Plot twist', icon: '🌀', prompt: 'Buatkan script scene dengan plot twist atau revelation yang mengejutkan' },
        { text: 'World building', icon: '🌍', prompt: 'Buatkan script scene yang expand dunia cerita dengan detail baru' }
      ]
    } else if (isLastEpisode) {
      return [
        ...baseShortcuts,
        { text: 'Klimaks scene', icon: '🏁', prompt: 'Buatkan script scene klimaks - puncak konflik yang sudah dibangun dari episode sebelumnya' },
        { text: 'Resolusi karakter', icon: '✅', prompt: 'Buatkan script scene resolusi arc karakter dengan satisfying conclusion' },
        { text: 'Jawab pertanyaan', icon: '💡', prompt: 'Buatkan script scene yang menjawab pertanyaan utama yang diajukan di episode 1' },
        { text: 'Twist akhir', icon: '🎭', prompt: 'Buatkan script scene dengan twist akhir atau setup untuk season berikutnya' }
      ]
    }

    // Default shortcuts for any other case
    return [
      { text: 'Buatkan 1 scene', icon: '🎬', prompt: 'Buatkan script 1 scene' },
      { text: 'Buatkan Full Episode', icon: '📺', prompt: 'Buatkan script Full Episode' },
      { text: 'Lanjutkan cerita', icon: '➡️', prompt: 'Lanjutkan script cerita' },
      { text: 'Buatkan dialog', icon: '💬', prompt: 'Buatkan script dialog antara karakter' },
      { text: 'Scene konflik', icon: '⚡', prompt: 'Buatkan script scene konflik' }
    ]
  }

  // Function to format script content for copy/download with proper screenplay formatting
  const formatScriptForCopy = (content: string): string => {
    const lines = content.split('\n')
    const formattedLines: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line) {
        formattedLines.push('')
        continue
      }
      
      // Scene Headings (INT./EXT. at start of line)
      if (line.match(/^(INT\.|EXT\.)/)) {
        formattedLines.push(line)
      }
      // Transitions (CUT TO:, DISSOLVE TO:, FADE TO:, etc.)
      else if (line.match(/^(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/)) {
        // Right align transitions (add spaces to push to right)
        const spaces = ' '.repeat(Math.max(0, 60 - line.length))
        formattedLines.push(spaces + line)
      }
      // Character names (all caps, centered)
      else if (line.match(/^[A-Z\s]+$/) && !line.includes('(') && !line.includes(')') && 
               !line.match(/^(INT\.|EXT\.|CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/) &&
               lines[i + 1] && lines[i + 1].trim() && !lines[i + 1].trim().match(/^[A-Z\s]+$/)) {
        // Center character names
        const spaces = ' '.repeat(Math.max(0, (60 - line.length) / 2))
        formattedLines.push(spaces + line)
      }
      // Parentheticals (text in parentheses)
      else if (line.match(/^\(.+\)$/)) {
        // Center parentheticals
        const spaces = ' '.repeat(Math.max(0, (60 - line.length) / 2))
        formattedLines.push(spaces + line)
      }
      // Dialogue (indented from both sides)
      else if (i > 0 && lines[i - 1].trim().match(/^[A-Z\s]+$/) && !lines[i - 1].trim().match(/^(INT\.|EXT\.|CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/)) {
        // Indent dialogue
        const spaces = ' '.repeat(20)
        formattedLines.push(spaces + line)
      }
      // Action lines (left aligned, full width)
      else {
        formattedLines.push(line)
      }
    }
    
    return formattedLines.join('\n')
  }

  const copyToClipboard = (text: string) => {
    const formattedContent = formatScriptForCopy(text)
    navigator.clipboard.writeText(formattedContent)
    toast.success('Script berhasil disalin dengan formatting yang benar!')
  }

  const downloadScript = (content: string) => {
    const formattedContent = formatScriptForCopy(content)
    const blob = new Blob([formattedContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${episode.title} - Script.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Script berhasil didownload dengan formatting yang benar!')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        {/* Header Title Bar */}
        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <button
                onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors min-w-0 flex-1 touch-manipulation"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                    Episode {episode.episodeNumber}: {episode.title}
                  </h2>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {episode.setting || 'Chat Interface'}
                  </p>
                </div>
                {isHeaderMinimized ? (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {!isHeaderMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="px-2 sm:px-4 pb-2 sm:pb-4 max-h-64 overflow-y-auto"
          >
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              {episode.synopsis || 'Belum ada sinopsis'}
            </p>
            
            {/* Episode Details */}
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span className="font-medium">Genre:</span>
                <span>{project.genre}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">Setting:</span>
                <span>{episode.setting}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-medium">Episode:</span>
                <span>{episode.episodeNumber}/{project.totalEpisodes}</span>
              </div>
            </div>

            {/* AI Context Indicators */}
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                <Sparkles className="h-3 w-3" />
                <span>AI Enhanced</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                <Palette className="h-3 w-3" />
                <span>Style DNA</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                <Network className="h-3 w-3" />
                <span>Knowledge Graph</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                <Globe className="h-3 w-3" />
                <span>Open Mode</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-4 mobile-scroll">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Mulai Percakapan
              </h3>
              <p className="text-gray-500 mb-4">
                Mulai chat dengan AI untuk mengembangkan script episode ini atau diskusi umum
              </p>
              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-md mx-auto">
                <p className="font-medium mb-2">Contoh pesan:</p>
                <p className="text-gray-700">"Buatkan script pembuka episode ini"</p>
                <p className="text-gray-700">"Bagaimana cara mengatasi writer's block?"</p>
                <p className="text-gray-700">"Cerita yang kita bikin udah seru belum?"</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-full sm:max-w-2xl ${message.role === 'user' ? 'ml-2 sm:ml-4 md:ml-12' : 'mr-2 sm:mr-4 md:mr-12'}`}>
                 <div className={`flex flex-col ${
                   message.role === 'user' ? 'items-end' : 'items-start'
                 }`}>
                   <div className={`chat-message ${message.role} group w-full pb-2`}>
                     {message.role === 'assistant' && message.metadata?.scriptGenerated === true ? (
                       <div className="space-y-4">
                         <ScriptMessage
                           message={message}
                           episode={episode}
                           copyToClipboard={copyToClipboard}
                           downloadScript={downloadScript}
                           setEditingScriptId={setEditingScriptId}
                           setEditingScriptContent={setEditingScriptContent}
                           setShowScriptEditModal={setShowScriptEditModal}
                           styleDNA={selectedStyleDNA || currentStyleDNA}
                         />
                         
                         {/* Action Buttons */}
                         <div className="flex items-center justify-center space-x-3 mt-4">
                           <button
                             onClick={() => {
                               const parsed = parseScriptContinuationResponse(message.content);
                               const content = parsed.continuation || message.content;
                               copyToClipboard(content);
                             }}
                             className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200 shadow-sm"
                           >
                             <Copy className="h-4 w-4" />
                             <span>Copy</span>
                           </button>
                           
                           <button
                             onClick={() => {
                               const parsed = parseScriptContinuationResponse(message.content);
                               const content = parsed.continuation || message.content;
                               downloadScript(content);
                             }}
                             className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200 shadow-sm"
                           >
                             <Download className="h-4 w-4" />
                             <span>Download</span>
                           </button>
                           
                           <button
                             onClick={() => {
                               const parsed = parseScriptContinuationResponse(message.content);
                               const content = parsed.continuation || message.content;
                               setEditingScriptId(message.id);
                               setEditingScriptContent(content);
                               setShowScriptEditModal(true);
                             }}
                             className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200 shadow-sm"
                           >
                             <Edit3 className="h-4 w-4" />
                             <span>Edit</span>
                           </button>
                         </div>
                       </div>
                     ) : (
                       <div className={`whitespace-pre-wrap font-sans text-sm sm:text-base rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-sm ${
                         message.role === 'user' 
                           ? 'text-blue-900 bg-blue-100 border border-blue-200' 
                           : 'text-gray-900 bg-white border border-gray-200'
                       }`}>
                         {message.content}
                       </div>
                     )}

                     {/* Edit indicator */}
                     {message.isEdited && (
                       <div className="mt-2 text-xs text-gray-500 italic">
                         (edited)
                       </div>
                     )}

                     {/* Message Editor - After bubble content */}
                     <MessageEditor
                       messageId={message.id}
                       currentContent={message.content}
                       isEditing={editingMessageId === message.id}
                       onStartEdit={() => setEditingMessageId(message.id)}
                       onCancelEdit={() => setEditingMessageId(null)}
                       onSaveEdit={(newContent, modes) => handleEditMessage(message.id, newContent, modes)}
                       onDeleteMessage={() => handleDeleteMessage(message.id)}
                       canEdit={message.role === 'user' && !isLoading}
                       isUserMessage={message.role === 'user'}
                       initialModes={activeModes}
                       // Style DNA props for consistency with prompt box
                       projectId={project.id}
                       availableStyleDNAs={availableStyleDNAs}
                       currentStyleDNA={currentStyleDNA}
                       onStyleDNASelect={handleStyleDNASelect}
                       showStyleDNASelector={showStyleDNASelector}
                       onShowStyleDNASelector={setShowStyleDNASelector}
                     />

                   </div>
                 </div>
              </div>
            </motion.div>
          ))
          )}
          
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <ThinkingIndicator step={thinkingStep} />
            </motion.div>
          )}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start"
            >
              <div className="max-w-2xl mr-4 sm:mr-12">
                <div className="chat-message ai">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-500">AI sedang mengetik...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Chat Shortcuts - moved inside scrollable area */}
          <div className="mt-4 mb-4">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-3 pt-2">
              {getContextualShortcuts().map((shortcut, index) => (
                <button
                  key={index}
                  onClick={() => handleShortcutClick(shortcut.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-50 border border-blue-300 rounded-xl text-xs sm:text-sm font-medium text-blue-800 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 touch-manipulation"
                >
                  <span className="text-sm sm:text-base">{shortcut.icon}</span>
                  <span className="truncate">{shortcut.text}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-2 sm:py-3 pb-4 mb-4 sticky bottom-0 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 focus-within:shadow-2xl focus-within:border-gray-300 p-3 sm:p-4">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={
                  activeModes.openMode
                    ? "Mode terbuka - tanyakan apapun, research, atau diskusi umum dengan Gemini..."
                    : activeModes.knowledgeGraph && activeModes.styleDNA
                    ? "Tuliskan ide cerita sesuai knowledge graph dan style DNA, atau diskusi umum..."
                    : activeModes.knowledgeGraph
                    ? "Tuliskan ide cerita sesuai knowledge graph yang sudah ada, atau diskusi umum..."
                    : activeModes.styleDNA
                    ? "Tuliskan ide cerita sesuai style DNA penulis, atau diskusi umum..."
                    : "Tuliskan ide cerita, minta script episode baru, diskusi umum, atau berikan feedback..."
                }
                className="w-full px-0 py-1 text-sm sm:text-base text-gray-900 placeholder-gray-500 bg-transparent border-0 resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
                rows={1}
                disabled={isLoading}
                style={{ minHeight: '24px', maxHeight: '80px' }}
              />
              
              {/* Mode Buttons - positioned at bottom like in the image */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1 mode-buttons-carousel">
                  <button
                    onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap touch-manipulation flex-shrink-0 ${
                      deepThinkEnabled
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="hidden sm:inline">Deep Think</span>
                    <span className="sm:hidden">Think</span>
                  </button>
                  <button
                    onClick={() => toggleMode('knowledgeGraph')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap touch-manipulation flex-shrink-0 ${
                      activeModes.knowledgeGraph
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Network className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Knowledge Graph</span>
                    <span className="sm:hidden">Graph</span>
                  </button>
                  <button
                    onClick={() => toggleMode('styleDNA')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap touch-manipulation flex-shrink-0 ${
                      activeModes.styleDNA
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Palette className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Style DNA</span>
                    <span className="sm:hidden">DNA</span>
                  </button>
                  <button
                    onClick={() => toggleMode('openMode')}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap touch-manipulation flex-shrink-0 ${
                      activeModes.openMode
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Open Mode</span>
                    <span className="sm:hidden">Open</span>
                  </button>
                </div>
                
                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 sm:p-3 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0 touch-manipulation flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Script Edit Modal */}
      <ScriptEditModal
        isOpen={showScriptEditModal}
        onClose={() => {
          setShowScriptEditModal(false)
          setEditingScriptId(null)
          setEditingScriptContent('')
        }}
        content={editingScriptContent}
        onSave={async (newContent: string) => {
          if (editingScriptId) {
            await handleEditScript(editingScriptId, newContent)
            // Close modal after successful save
            setShowScriptEditModal(false)
            setEditingScriptId(null)
            setEditingScriptContent('')
          }
        }}
        title="Edit Script"
      />

      {/* Style DNA Selector Modal */}
      {showStyleDNASelector && (
        <StyleDNASelectorModal
          projectId={project.id}
          onClose={() => setShowStyleDNASelector(false)}
          onSelect={handleStyleDNASelect}
          loading={isLoading}
        />
      )}
    </div>
  )
}


