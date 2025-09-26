'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Check, 
  X, 
  AlertTriangle, 
  Clock,
  Trash2,
  RotateCcw,
  Lightbulb,
  Network,
  Palette,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import StyleDNASelectorModal from './StyleDNASelectorModal';

interface MessageEditorProps {
  messageId: string;
  currentContent: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (newContent: string, modes?: { deepThink: boolean; knowledgeGraph: boolean; styleDNA: boolean; openMode: boolean }) => Promise<void>;
  onDeleteMessage: () => Promise<void>;
  canEdit: boolean;
  isUserMessage: boolean;
  initialModes?: {
    deepThink: boolean;
    knowledgeGraph: boolean;
    styleDNA: boolean;
    openMode: boolean;
  };
  // Add Style DNA props for consistency with prompt box
  projectId?: string;
  availableStyleDNAs?: any[];
  currentStyleDNA?: any;
  onStyleDNASelect?: (styleDNA: any) => void;
  showStyleDNASelector?: boolean;
  onShowStyleDNASelector?: (show: boolean) => void;
}

export default function MessageEditor({
  messageId,
  currentContent,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteMessage,
  canEdit,
  isUserMessage,
  initialModes = { deepThink: false, knowledgeGraph: false, styleDNA: false, openMode: false },
  // Style DNA props
  projectId = '',
  availableStyleDNAs = [],
  currentStyleDNA = null,
  onStyleDNASelect,
  showStyleDNASelector = false,
  onShowStyleDNASelector
}: MessageEditorProps) {
  const [editContent, setEditContent] = useState(currentContent);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modes, setModes] = useState({
    deepThink: initialModes.deepThink,
    knowledgeGraph: initialModes.knowledgeGraph,
    styleDNA: initialModes.styleDNA,
    openMode: initialModes.openMode
  });
  const [isModalMinimized, setIsModalMinimized] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent.length]);

  // Minimize modal when Style DNA selector is open
  useEffect(() => {
    if (showStyleDNASelector) {
      setIsModalMinimized(true);
    } else {
      setIsModalMinimized(false);
    }
  }, [showStyleDNASelector]);

  // Update modes when initialModes change
  useEffect(() => {
    setModes({
      deepThink: initialModes.deepThink,
      knowledgeGraph: initialModes.knowledgeGraph,
      styleDNA: initialModes.styleDNA,
      openMode: initialModes.openMode
    });
  }, [initialModes]);

  // Style DNA toggle with same logic as prompt box
  const toggleStyleDNA = () => {
    if (availableStyleDNAs.length > 1) {
      // Show Style DNA selector if multiple available
      if (onShowStyleDNASelector) {
        onShowStyleDNASelector(true);
      }
      return;
    } else if (availableStyleDNAs.length === 1) {
      // Use the only available Style DNA
      if (onStyleDNASelect) {
        onStyleDNASelect(availableStyleDNAs[0]);
      }
    }
    
    // Toggle Style DNA mode
    setModes(prev => ({
      ...prev,
      styleDNA: !prev.styleDNA
    }));
  };

  const handleSave = async () => {
    if (editContent.trim() === currentContent.trim()) {
      onCancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      await onSaveEdit(editContent.trim(), modes);
      toast.success('Message updated successfully');
    } catch (error) {
      console.error('Error saving edit:', error);
      toast.error('Failed to update message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(currentContent);
    onCancelEdit();
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await onDeleteMessage();
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!canEdit) return null;

  return (
    <>
      {/* Edit Button - Below bubble */}
      {!isEditing && (
        <div className="flex justify-end mb-4 opacity-0 group-hover:opacity-100 transition-all duration-200 relative z-10">
          <div className="flex items-center space-x-2">
            <button
              onClick={onStartEdit}
              className="p-1.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md shadow-sm transition-all duration-200 hover:shadow-md min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Edit message"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            
            {isUserMessage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-md shadow-sm transition-all duration-200 hover:shadow-md min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Delete message"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit Mode - GPT Style */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isModalMinimized ? 0.3 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[99999] p-4 message-editor-modal"
            data-message-editor="true"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ 
                scale: isModalMinimized ? 0.95 : 1, 
                opacity: isModalMinimized ? 0.3 : 1 
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden message-editor-content modal-mobile flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">Edit Message</h3>
                <p className="text-sm text-gray-500 mt-1">This will regenerate the AI response</p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto mobile-scroll p-4 sm:p-6">
                {/* Edit Textarea - GPT Style */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[150px] sm:min-h-[200px] max-h-[300px] sm:max-h-[400px] p-4 bg-gray-50 border-0 rounded-xl resize-none focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 text-base leading-relaxed mobile-text-select"
                    placeholder="Edit your message..."
                    disabled={isSaving}
                    style={{ 
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  
                  {/* Character count */}
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {editContent.length} characters
                  </div>
                </div>

                {/* Warning */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Note:</p>
                      <p className="text-xs mt-1">Editing will delete AI responses after this message and generate a new response.</p>
                    </div>
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="mt-4 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">AI Mode untuk Edit:</h4>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                    {/* Deep Think */}
                    <button
                      type="button"
                      onClick={() => setModes(prev => ({ ...prev, deepThink: !prev.deepThink }))}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border mobile-touch-target ${
                        modes.deepThink 
                          ? 'bg-blue-100 text-blue-800 border-blue-300' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Lightbulb className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>Deep Think</span>
                    </button>
                    
                    {/* Knowledge Graph */}
                    <button
                      type="button"
                      onClick={() => setModes(prev => ({ ...prev, knowledgeGraph: !prev.knowledgeGraph }))}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border mobile-touch-target ${
                        modes.knowledgeGraph 
                          ? 'bg-blue-100 text-blue-800 border-blue-300' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Network className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>Knowledge Graph</span>
                    </button>
                    
                    {/* Style DNA */}
                    <button
                      type="button"
                      onClick={toggleStyleDNA}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border mobile-touch-target ${
                        modes.styleDNA 
                          ? 'bg-blue-100 text-blue-800 border-blue-300' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>Style DNA</span>
                    </button>
                    
                    {/* Open Mode */}
                    <button
                      type="button"
                      onClick={() => setModes(prev => ({ ...prev, openMode: !prev.openMode }))}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 border mobile-touch-target ${
                        modes.openMode 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>Open Mode</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Pilih mode AI yang akan digunakan untuk memproses edit message ini.
                  </p>
                </div>
              </div>

              {/* Footer - GPT Style */}
              <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>This action cannot be undone</span>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-all duration-200 disabled:opacity-50 mobile-touch-target"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={isSaving || editContent.trim() === currentContent.trim()}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mobile-touch-target"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>
                          Save & Regenerate
                          {Object.values(modes).some(Boolean) && (
                            <span className="ml-1 text-xs opacity-75">
                              ({Object.entries(modes).filter(([_, active]) => active).map(([key, _]) => 
                                key === 'deepThink' ? '🧠' : 
                                key === 'knowledgeGraph' ? '🕸️' : 
                                key === 'styleDNA' ? '🎨' : ''
                              ).join(' ')})
                            </span>
                          )}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Delete Message
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to delete this message? This will also delete all AI responses after this message.
                  </p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Style DNA Selector Modal for Edit Message */}
      {showStyleDNASelector && onShowStyleDNASelector && onStyleDNASelect && projectId && (
        <StyleDNASelectorModal
          projectId={projectId}
          onClose={() => onShowStyleDNASelector(false)}
          onSelect={(styleDNA) => {
            onStyleDNASelect(styleDNA);
            onShowStyleDNASelector(false);
            // Also update the modes to enable Style DNA
            setModes(prev => ({
              ...prev,
              styleDNA: true
            }));
            toast.success(`Style DNA "${styleDNA.thematicVoice?.thematicVoice || 'Style DNA'}" dipilih!`);
          }}
          loading={isSaving}
        />
      )}
    </>
  );
}
