'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScriptEditModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  onSave: (newContent: string) => Promise<void>
  title?: string
}

export default function ScriptEditModal({ 
  isOpen, 
  onClose, 
  content, 
  onSave, 
  title = "Edit Script" 
}: ScriptEditModalProps) {
  const [editedContent, setEditedContent] = useState(content)
  const [isSaving, setIsSaving] = useState(false)

  // Update content when prop changes
  useEffect(() => {
    setEditedContent(content)
  }, [content])

  const handleSave = async () => {
    if (editedContent.trim() === content.trim()) {
      onClose()
      return
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      '⚠️ PERINGATAN!\n\n' +
      'Menyimpan edit script ini akan menghapus semua chat dan script yang dibuat setelah script ini.\n\n' +
      'Apakah Anda yakin ingin melanjutkan?'
    )

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    try {
      await onSave(editedContent.trim())
      // Don't show toast here - let handleEditScript handle it
      onClose()
    } catch (error) {
      console.error('Error saving script:', error)
      toast.error('Gagal menyimpan script')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(content)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4 modal-overlay">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden modal-content modal-mobile">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 mobile-touch-target"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto mobile-scroll p-4 sm:p-6">
          {/* Warning Box */}
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-sm font-bold">⚠️</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-800 mb-1">
                  Peringatan Penting
                </h4>
                <p className="text-sm text-amber-700">
                  Menyimpan edit script ini akan <strong>menghapus semua chat dan script</strong> yang dibuat setelah script ini. 
                  Pastikan Anda sudah yakin dengan perubahan yang akan disimpan.
                </p>
              </div>
            </div>
          </div>

          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-80 sm:h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-text-select"
            style={{ fontFamily: 'Menlo, Monaco, "Courier New", monospace' }}
            placeholder="Edit script content..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save & Hapus Chat Setelahnya</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
