'use client'

import { Copy, Download, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMemo } from 'react'

interface ScriptRendererProps {
  content: string
  episodeTitle: string
  onCopy: (content: string) => void
  onDownload: (content: string) => void
  onEdit?: () => void
  canEdit?: boolean
}

// Function to format script content for copy/download with proper screenplay formatting
function formatScriptForCopy(content: string): string {
  const lines = content.split('\n')
  const formattedLines: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    
    // Preprocess: Fix incomplete transitions (add missing colons)
    if (line.match(/^(smash cut to|cut to|dissolve to|fade to|fade out|fade in|montage)(\s|$)/i)) {
      line = line.replace(/^(smash cut to|cut to|dissolve to|fade to|fade out|fade in|montage)(\s|$)/i, (match, transition) => {
        return transition.toUpperCase() + ':';
      });
    }
    
    // Preprocess: Fix standalone "SMASH" - should be "SMASH CUT TO:"
    if (line === 'SMASH' || line === 'smash') {
      line = 'SMASH CUT TO:';
    }
    
    // Skip empty lines
    if (!line) {
      formattedLines.push('')
      continue
    }
    
    // Scene Headings (INT./EXT. at start of line) - Left aligned, no indentation
    if (line.match(/^(INT\.|EXT\.)/)) {
      formattedLines.push(line)
    }
    // Transitions (CUT TO:, DISSOLVE TO:, FADE TO:, etc.) - Right aligned
    else if (line.match(/^(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/i)) {
      // Right align transitions (add spaces to push to right)
      const spaces = ' '.repeat(Math.max(0, 65 - line.length))
      formattedLines.push(spaces + line)
    }
    // Character names (all caps, centered, 4 inches from left margin)
    else if (line.match(/^[A-Z\s]+$/) && !line.includes('(') && !line.includes(')') && 
             !line.match(/^(INT\.|EXT\.|CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/) &&
             lines[i + 1] && lines[i + 1].trim() && !lines[i + 1].trim().match(/^[A-Z\s]+$/)) {
      // Character names: 4 inches from left margin (approximately 32 spaces)
      const spaces = ' '.repeat(32)
      formattedLines.push(spaces + line)
    }
    // Parentheticals (text in parentheses) - Indented from character name
    else if (line.match(/^\(.+\)$/)) {
      // Parentheticals: 3.5 inches from left margin (approximately 28 spaces)
      const spaces = ' '.repeat(28)
      formattedLines.push(spaces + line)
    }
    // Dialogue (indented from character name)
    else if (i > 0 && lines[i - 1].trim().match(/^[A-Z\s]+$/) && !lines[i - 1].trim().match(/^(INT\.|EXT\.|CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/)) {
      // Dialogue: 2.5 inches from left margin (approximately 20 spaces)
      const spaces = ' '.repeat(20)
      formattedLines.push(spaces + line)
    }
    // Action lines (left aligned, full width, no indentation)
    else {
      formattedLines.push(line)
    }
  }
  
  return formattedLines.join('\n')
}

// Function to parse and format script content according to screenplay standards for display
function formatScriptContent(content: string) {
  const lines = content.split('\n')
  const formattedLines: JSX.Element[] = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    
    // Preprocess: Fix incomplete transitions (add missing colons)
    if (line.match(/^(smash cut to|cut to|dissolve to|fade to|fade out|fade in|montage)(\s|$)/i)) {
      line = line.replace(/^(smash cut to|cut to|dissolve to|fade to|fade out|fade in|montage)(\s|$)/i, (match, transition) => {
        return transition.toUpperCase() + ':';
      });
    }
    
    // Preprocess: Fix standalone "SMASH" - should be "SMASH CUT TO:"
    if (line === 'SMASH' || line === 'smash') {
      line = 'SMASH CUT TO:';
    }
    
    // Skip empty lines
    if (!line) {
      formattedLines.push(<br key={i} />)
      continue
    }
    
    // Scene Headings (INT./EXT. at start of line) - Left aligned, bold, uppercase
    // Scene headings detection
    if (line.match(/^(\*\*)?(INT\.|EXT\.|INT\/EXT\.|INT-EXT\.)/)) {
      // Apply bold styling with CSS
      
      formattedLines.push(
        <div key={i} className="text-left font-bold text-black uppercase tracking-wide mb-2">
          {line}
        </div>
      )
    }
    // Transitions (CUT TO:, DISSOLVE TO:, FADE TO:, etc.) - Right aligned
    else if (line.match(/^(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/i)) {
      formattedLines.push(
        <div key={i} className="text-right font-bold text-black uppercase tracking-wide mb-2">
          {line}
        </div>
      )
    }
    // Character names (all caps, centered, 4 inches from left margin)
    // Scene headings detection
    else if (line.match(/^(\*\*)?[A-Z\s]+(\*\*)?$/) && !line.includes('(') && !line.includes(')') && 
             !line.match(/^(\*\*)?(INT\.|EXT\.|INT\/EXT\.|INT-EXT\.|CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/) &&
             lines[i + 1] && lines[i + 1].trim() && !lines[i + 1].trim().match(/^(\*\*)?[A-Z\s]+(\*\*)?$/)) {
      // Apply bold styling with CSS
      
      formattedLines.push(
        <div key={i} className="ml-32 font-bold text-black uppercase tracking-wide mt-3 mb-1">
          {line}
        </div>
      )
    }
    // Parentheticals (text in parentheses) - Indented from character name
    else if (line.match(/^\(.+\)$/)) {
      formattedLines.push(
        <div key={i} className="ml-28 text-gray-700 italic mb-1">
          {line}
        </div>
      )
    }
    // Dialogue (indented from character name)
    else if (i > 0 && lines[i - 1].trim().match(/^[A-Z\s]+$/) && !lines[i - 1].trim().match(/^(INT\.|EXT\.|CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MONTAGE|FADE OUT|FADE IN)/)) {
      formattedLines.push(
        <div key={i} className="ml-20 mr-16 text-black leading-relaxed mb-2">
          {line}
        </div>
      )
    }
    // Action lines (left aligned, full width, no indentation)
    else {
      formattedLines.push(
        <div key={i} className="text-left text-black leading-relaxed mb-1">
          {line}
        </div>
      )
    }
  }
  
  return formattedLines
}

export default function ScriptRenderer({ 
  content, 
  episodeTitle, 
  onCopy,
  onDownload,
  onEdit,
  canEdit = false
}: ScriptRendererProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    }
  }

  const handleCopy = () => {
    const formattedContent = formatScriptForCopy(content)
    onCopy(formattedContent)
    toast.success('Copied with proper formatting!', {
      duration: 2000,
      style: {
        background: '#10b981',
        color: 'white',
        fontSize: '14px',
        padding: '8px 12px',
        borderRadius: '8px',
      },
    })
  }

  const handleDownload = () => {
    const formattedContent = formatScriptForCopy(content)
    onDownload(formattedContent)
  }

  // Format the script content according to screenplay standards
  const formattedContent = useMemo(() => {
    return formatScriptContent(content)
  }, [content])

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm relative">
      {/* Sticky Header - Cursor Style */}
      <div className="sticky top-0 z-5 bg-white border-b border-gray-200 rounded-t-xl backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Script</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Script Content"></div>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              {episodeTitle}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all duration-200 shadow-sm"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all duration-200 shadow-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            {canEdit && (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-all duration-200 shadow-sm"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Script Content - Natural Flow */}
      <div className="w-full p-8 relative" style={{ fontFamily: 'Courier New, monospace', fontSize: '12pt', lineHeight: '1.2' }}>
        <div className="max-w-5xl mx-auto" style={{ lineHeight: '1.6' }}>
          {formattedContent}
        </div>
      </div>
    </div>
  )
}
