'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Plus, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Eye,
  Download
} from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ScriptGenerationModesProps {
  projectId: string;
  userId: string;
  onScriptGenerated?: (script: string) => void;
}

interface GenerationTask {
  id: string;
  type: 'continue' | 'new_script';
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
  createdAt: Date;
}

export default function ScriptGenerationModes({ 
  projectId, 
  userId, 
  onScriptGenerated 
}: ScriptGenerationModesProps) {
  const [activeMode, setActiveMode] = useState<'continue' | 'new_script' | null>(null);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for continuation
  const [continuationForm, setContinuationForm] = useState({
    existingScript: '',
    targetPages: 10,
    context: ''
  });

  // Form states for new script
  const [newScriptForm, setNewScriptForm] = useState({
    title: '',
    logline: '',
    genre: 'Drama',
    tone: 'Melodrama',
    targetDuration: 90,
    characterBible: '',
    beatSheet: ''
  });

  const handleContinueScript = async () => {
    if (!continuationForm.existingScript) {
      setError('Naskah existing harus diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const taskId = Date.now().toString();
      const newTask: GenerationTask = {
        id: taskId,
        type: 'continue',
        status: 'processing',
        createdAt: new Date()
      };

      setTasks(prev => [newTask, ...prev]);

      // Generate continuation
      const continuationPrompt = `Lanjutkan naskah berikut:

NAASKAH EXISTING:
\`\`\`
${continuationForm.existingScript}
\`\`\`

KONTEKS:
${continuationForm.context}

TARGET: ${continuationForm.targetPages} halaman

Instruksi:
1. Lanjutkan naskah dengan gaya yang konsisten
2. Pertahankan karakter dan tone yang sudah established
3. Buat transisi yang smooth dan natural
4. Akhiri dengan cliffhanger yang appropriate
5. Format output dalam format skrip standar

Output yang diharapkan:
- Lanjutan naskah yang seamless
- Karakter yang konsisten
- Plot development yang logis
- Dialog yang authentic`;

      // TODO: Integrate with Gemini API
      // const result = await geminiService.generateContent(continuationPrompt);
      
      // Mock result for now
      const mockResult = `[SCENE HEADING]
[ACTION/DESCRIPTION]

CHARACTER NAME
Dialog yang sesuai dengan karakter

[ACTION/DESCRIPTION]

[Cliffhanger untuk commercial break]`;

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', result: mockResult }
          : task
      ));

      onScriptGenerated?.(mockResult);
    } catch (err) {
      setError('Gagal melanjutkan naskah');
      setTasks(prev => prev.map(task => 
        task.id === Date.now().toString()
          ? { ...task, status: 'error', error: 'Gagal melanjutkan naskah' }
          : task
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleNewScript = async () => {
    if (!newScriptForm.title || !newScriptForm.logline) {
      setError('Judul dan logline harus diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const taskId = Date.now().toString();
      const newTask: GenerationTask = {
        id: taskId,
        type: 'new_script',
        status: 'processing',
        createdAt: new Date()
      };

      setTasks(prev => [newTask, ...prev]);

      // Generate new script
      const newScriptPrompt = `Buat naskah baru dengan spesifikasi berikut:

JUDUL: ${newScriptForm.title}
LOGLINE: ${newScriptForm.logline}
GENRE: ${newScriptForm.genre}
TONE: ${newScriptForm.tone}
DURASI: ${newScriptForm.targetDuration} menit

KARAKTER:
${newScriptForm.characterBible}

BEAT SHEET:
${newScriptForm.beatSheet}

Instruksi:
1. Buat naskah lengkap dengan struktur 4 act
2. Gunakan gaya penulisan yang konsisten
3. Kembangkan karakter dengan depth yang sesuai
4. Buat plot yang engaging dari awal sampai akhir
5. Sertakan cliffhanger natural untuk commercial breaks
6. Format output dalam format skrip standar

Output yang diharapkan:
- Naskah lengkap dengan struktur yang solid
- Karakter yang well-developed
- Plot yang engaging
- Dialog yang authentic
- Tone yang konsisten`;

      // TODO: Integrate with Gemini API
      // const result = await geminiService.generateContent(newScriptPrompt);
      
      // Mock result for now
      const mockResult = `TITLE: ${newScriptForm.title}
WRITER: AI Generated
DURATION: ${newScriptForm.targetDuration} minutes
GENRE: ${newScriptForm.genre}
TONE: ${newScriptForm.tone}

ACT 1: [Script content...]
ACT 2A: [Script content...]
ACT 2B: [Script content...]
ACT 3: [Script content...]`;

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', result: mockResult }
          : task
      ));

      onScriptGenerated?.(mockResult);
    } catch (err) {
      setError('Gagal membuat naskah baru');
      setTasks(prev => prev.map(task => 
        task.id === Date.now().toString()
          ? { ...task, status: 'error', error: 'Gagal membuat naskah baru' }
          : task
      ));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveMode('continue')}
          className={`p-4 border-2 rounded-lg text-left transition-colors ${
            activeMode === 'continue'
              ? 'border-black bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <Play className="h-6 w-6 text-black" />
            <h3 className="text-lg font-medium text-black">Lanjutkan Cerita</h3>
          </div>
          <p className="text-sm text-gray-600">
            Lanjutkan naskah yang sudah ada dengan gaya penulisan yang konsisten
          </p>
        </button>

        <button
          onClick={() => setActiveMode('new_script')}
          className={`p-4 border-2 rounded-lg text-left transition-colors ${
            activeMode === 'new_script'
              ? 'border-black bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <Plus className="h-6 w-6 text-black" />
            <h3 className="text-lg font-medium text-black">Tulis Cerita Baru</h3>
          </div>
          <p className="text-sm text-gray-600">
            Buat naskah baru dari awal dengan gaya penulisan yang sama
          </p>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Continue Script Form */}
      {activeMode === 'continue' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-medium text-black mb-4">Lanjutkan Naskah</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Naskah Existing
              </label>
              <textarea
                value={continuationForm.existingScript}
                onChange={(e) => setContinuationForm(prev => ({ ...prev, existingScript: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                rows={8}
                placeholder="Paste naskah yang sudah ada di sini..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Halaman
                </label>
                <input
                  type="number"
                  value={continuationForm.targetPages}
                  onChange={(e) => setContinuationForm(prev => ({ ...prev, targetPages: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konteks Tambahan (Opsional)
              </label>
              <textarea
                value={continuationForm.context}
                onChange={(e) => setContinuationForm(prev => ({ ...prev, context: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                rows={3}
                placeholder="Konteks tambahan untuk melanjutkan cerita..."
              />
            </div>

            <button
              onClick={handleContinueScript}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Play className="h-4 w-4" />}
              <span>Lanjutkan Naskah</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* New Script Form */}
      {activeMode === 'new_script' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-medium text-black mb-4">Naskah Baru</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul
                </label>
                <input
                  type="text"
                  value={newScriptForm.title}
                  onChange={(e) => setNewScriptForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Judul naskah..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durasi (menit)
                </label>
                <input
                  type="number"
                  value={newScriptForm.targetDuration}
                  onChange={(e) => setNewScriptForm(prev => ({ ...prev, targetDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  min="30"
                  max="180"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logline
              </label>
              <input
                type="text"
                value={newScriptForm.logline}
                onChange={(e) => setNewScriptForm(prev => ({ ...prev, logline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Logline singkat..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  value={newScriptForm.genre}
                  onChange={(e) => setNewScriptForm(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="Drama">Drama</option>
                  <option value="Komedi">Komedi</option>
                  <option value="Romance">Romance</option>
                  <option value="Action">Action</option>
                  <option value="Thriller">Thriller</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={newScriptForm.tone}
                  onChange={(e) => setNewScriptForm(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="Melodrama">Melodrama</option>
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                  <option value="Grounded">Grounded</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Character Bible
              </label>
              <textarea
                value={newScriptForm.characterBible}
                onChange={(e) => setNewScriptForm(prev => ({ ...prev, characterBible: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                rows={4}
                placeholder="Deskripsi karakter utama..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beat Sheet (Opsional)
              </label>
              <textarea
                value={newScriptForm.beatSheet}
                onChange={(e) => setNewScriptForm(prev => ({ ...prev, beatSheet: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                rows={4}
                placeholder="Beat sheet atau outline cerita..."
              />
            </div>

            <button
              onClick={handleNewScript}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Plus className="h-4 w-4" />}
              <span>Buat Naskah Baru</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Tasks List */}
      {tasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-black">Hasil Generate</h3>
          {tasks.map(task => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-black">
                    {task.type === 'continue' ? 'Lanjutkan Naskah' : 'Naskah Baru'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {task.createdAt.toLocaleDateString()} {task.createdAt.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {task.status === 'completed' && (
                    <>
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-black">
                        <Eye className="h-4 w-4" />
                        <span>Lihat</span>
                      </button>
                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-black">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {task.result && (
                <div className="mt-4">
                  <div className="bg-gray-50 rounded border p-3 max-h-40 overflow-y-auto">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                      {task.result.substring(0, 500)}
                      {task.result.length > 500 && '...'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
