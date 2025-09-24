const fs = require('fs');
const path = require('path');

class AICodeAnalyzer {
  constructor() {
    this.analysisResults = {
      issues: [],
      recommendations: [],
      fixes: []
    };
  }

  async analyzeEpisodeSelectionIssue() {
    console.log('🤖 AI Code Analyzer: Starting code analysis...');
    
    // Analyze the main project file
    await this.analyzeProjectFile();
    
    // Analyze episode creation modal
    await this.analyzeCreateEpisodeModal();
    
    // Analyze chat interface
    await this.analyzeChatInterface();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Generate fixes
    this.generateFixes();
    
    return this.analysisResults;
  }

  async analyzeProjectFile() {
    console.log('🤖 AI Code Analyzer: Analyzing project file...');
    
    const filePath = 'app/projects/project/page.tsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for race condition in handleEpisodeCreated
    if (content.includes('setEpisodeSelectionLocked(false)')) {
      this.analysisResults.issues.push({
        type: 'race_condition',
        file: filePath,
        function: 'handleEpisodeCreated',
        description: 'setEpisodeSelectionLocked(false) causes race condition',
        severity: 'critical',
        line: this.findLineNumber(content, 'setEpisodeSelectionLocked(false)')
      });
    }
    
    // Check for onSnapshot debouncing
    if (!content.includes('timeSinceLastSnapshot < 100')) {
      this.analysisResults.issues.push({
        type: 'missing_debouncing',
        file: filePath,
        function: 'fetchEpisodes',
        description: 'Missing or insufficient onSnapshot debouncing',
        severity: 'high'
      });
    }
    
    // Check for episode selection logic
    if (content.includes('CONDITION 3') && content.includes('AUTO-SELECT FIRST EPISODE')) {
      this.analysisResults.issues.push({
        type: 'auto_selection_issue',
        file: filePath,
        function: 'fetchEpisodes',
        description: 'Auto-selection logic may cause redirect to episode 1',
        severity: 'high'
      });
    }
    
    // Check for state management
    const stateVariables = [
      'episodeSelectionLocked',
      'pendingNewEpisodeId',
      'isInitialLoad',
      'selectedEpisode'
    ];
    
    stateVariables.forEach(variable => {
      if (!content.includes(variable)) {
        this.analysisResults.issues.push({
          type: 'missing_state',
          file: filePath,
          description: `Missing state variable: ${variable}`,
          severity: 'medium'
        });
      }
    });
  }

  async analyzeCreateEpisodeModal() {
    console.log('🤖 AI Code Analyzer: Analyzing create episode modal...');
    
    const filePath = 'components/CreateEpisodeModal.tsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for onSuccess callback
    if (content.includes('onSuccess(docRef.id)')) {
      this.analysisResults.issues.push({
        type: 'callback_issue',
        file: filePath,
        function: 'onSubmit',
        description: 'onSuccess callback may trigger race condition',
        severity: 'high'
      });
    }
    
    // Check for episode number calculation
    if (content.includes('getNextEpisodeNumber')) {
      this.analysisResults.issues.push({
        type: 'episode_number_race',
        file: filePath,
        function: 'getNextEpisodeNumber',
        description: 'Episode number calculation may cause race condition',
        severity: 'medium'
      });
    }
  }

  async analyzeChatInterface() {
    console.log('🤖 AI Code Analyzer: Analyzing chat interface...');
    
    const filePath = 'components/ChatInterface.tsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for onSnapshot in chat
    if (content.includes('onSnapshot')) {
      this.analysisResults.issues.push({
        type: 'chat_snapshot_issue',
        file: filePath,
        function: 'fetchMessages',
        description: 'Chat interface onSnapshot may interfere with episode selection',
        severity: 'medium'
      });
    }
    
    // Check for episode status update
    if (content.includes('updateDoc') && content.includes('episodes')) {
      this.analysisResults.issues.push({
        type: 'episode_update_issue',
        file: filePath,
        function: 'sendMessage',
        description: 'Episode status update may trigger onSnapshot',
        severity: 'medium'
      });
    }
  }

  generateRecommendations() {
    console.log('🤖 AI Code Analyzer: Generating recommendations...');
    
    // Critical recommendations
    if (this.analysisResults.issues.some(issue => issue.type === 'race_condition')) {
      this.analysisResults.recommendations.push({
        priority: 'critical',
        title: 'Fix Race Condition in handleEpisodeCreated',
        description: 'Remove setEpisodeSelectionLocked(false) from handleEpisodeCreated function',
        impact: 'Prevents redirect to episode 1 after episode creation'
      });
    }
    
    // High priority recommendations
    if (this.analysisResults.issues.some(issue => issue.type === 'missing_debouncing')) {
      this.analysisResults.recommendations.push({
        priority: 'high',
        title: 'Improve onSnapshot Debouncing',
        description: 'Increase debouncing time and add better state validation',
        impact: 'Prevents multiple rapid onSnapshot triggers'
      });
    }
    
    if (this.analysisResults.issues.some(issue => issue.type === 'auto_selection_issue')) {
      this.analysisResults.recommendations.push({
        priority: 'high',
        title: 'Fix Auto-Selection Logic',
        description: 'Improve condition 3 logic to prevent unwanted redirects',
        impact: 'Ensures correct episode selection'
      });
    }
    
    // Medium priority recommendations
    if (this.analysisResults.issues.some(issue => issue.type === 'callback_issue')) {
      this.analysisResults.recommendations.push({
        priority: 'medium',
        title: 'Improve Episode Creation Callback',
        description: 'Add validation and error handling to onSuccess callback',
        impact: 'More robust episode creation process'
      });
    }
  }

  generateFixes() {
    console.log('🤖 AI Code Analyzer: Generating fixes...');
    
    // Fix 1: Remove race condition
    this.analysisResults.fixes.push({
      type: 'code_fix',
      file: 'app/projects/project/page.tsx',
      function: 'handleEpisodeCreated',
      description: 'Remove setEpisodeSelectionLocked(false) to prevent race condition',
      code: `
  const handleEpisodeCreated = (newEpisodeId: string) => {
    console.log('=== EPISODE CREATED DEBUG ===')
    console.log('New episode ID:', newEpisodeId)
    console.log('Current episodeSelectionLocked:', episodeSelectionLocked)
    
    setShowCreateEpisode(false)
    setPendingNewEpisodeId(newEpisodeId)
    // CRITICAL FIX: HAPUS setEpisodeSelectionLocked(false) - INI PENYEBAB UTAMA REDIRECT KE EPISODE 1
    // Episode selection tetap locked untuk mencegah race condition dengan onSnapshot
    
    // Update URL to include the new episode ID
    const url = new URL(window.location.href)
    url.searchParams.set('episodeId', newEpisodeId)
    window.history.replaceState({}, '', url.toString())
    
    console.log('URL updated with episodeId:', newEpisodeId)
    console.log('Pending episode set, episodeSelectionLocked remains:', episodeSelectionLocked)
    console.log('Waiting for onSnapshot to handle episode selection...')
  }`
    });
    
    // Fix 2: Improve debouncing
    this.analysisResults.fixes.push({
      type: 'code_fix',
      file: 'app/projects/project/page.tsx',
      function: 'fetchEpisodes',
      description: 'Improve onSnapshot debouncing and add state validation',
      code: `
  const fetchEpisodes = async () => {
    try {
      const q = query(
        collection(db, 'episodes'),
        where('projectId', '==', projectId)
      )
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        // Enhanced debouncing: Prevent rapid successive calls
        const now = Date.now()
        const timeSinceLastSnapshot = now - lastSnapshotTimeRef.current
        if (timeSinceLastSnapshot < 300) { // Increased to 300ms
          console.log('⏱️ Debouncing onSnapshot call (too soon after last call)')
          return
        }
        lastSnapshotTimeRef.current = now
        
        // Add state validation before processing
        if (episodeSelectionLocked && pendingNewEpisodeId) {
          console.log('🔒 Episode selection locked with pending episode, skipping auto-selection')
          return
        }
        
        // ... rest of the logic
      })
    } catch (error) {
      console.error('Error fetching episodes:', error)
    }
  }`
    });
    
    // Fix 3: Add episode selection state machine
    this.analysisResults.fixes.push({
      type: 'new_feature',
      file: 'app/projects/project/page.tsx',
      description: 'Add episode selection state machine for better control',
      code: `
  // Add episode selection state machine
  type EpisodeSelectionState = 'idle' | 'loading' | 'selecting' | 'locked' | 'error'
  const [episodeSelectionState, setEpisodeSelectionState] = useState<EpisodeSelectionState>('idle')
  
  // Enhanced episode selection logic
  const selectEpisodeSafely = async (episodeId: string) => {
    if (episodeSelectionState === 'selecting' || episodeSelectionState === 'locked') {
      console.log('🚫 Episode selection in progress, skipping')
      return
    }
    
    setEpisodeSelectionState('selecting')
    try {
      // Safe episode selection logic
      const episode = episodes.find(ep => ep.id === episodeId)
      if (episode) {
        setSelectedEpisode(episode)
        setEpisodeSelectionState('locked')
        console.log('✅ Episode selected safely:', episodeId)
      }
    } catch (error) {
      setEpisodeSelectionState('error')
      console.error('❌ Episode selection failed:', error)
    }
  }`
    });
  }

  findLineNumber(content, searchText) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return -1;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.analysisResults.issues.length,
        criticalIssues: this.analysisResults.issues.filter(i => i.severity === 'critical').length,
        highIssues: this.analysisResults.issues.filter(i => i.severity === 'high').length,
        mediumIssues: this.analysisResults.issues.filter(i => i.severity === 'medium').length,
        totalRecommendations: this.analysisResults.recommendations.length,
        totalFixes: this.analysisResults.fixes.length
      },
      issues: this.analysisResults.issues,
      recommendations: this.analysisResults.recommendations,
      fixes: this.analysisResults.fixes
    };
    
    return report;
  }
}

// Run the analysis
async function runAnalysis() {
  const analyzer = new AICodeAnalyzer();
  const results = await analyzer.analyzeEpisodeSelectionIssue();
  const report = analyzer.generateReport();
  
  console.log('🤖 AI Code Analyzer: Analysis complete!');
  console.log('Summary:', report.summary);
  console.log('Issues found:', report.issues.length);
  console.log('Recommendations:', report.recommendations.length);
  console.log('Fixes generated:', report.fixes.length);
  
  // Save report
  fs.writeFileSync('ai-code-analysis-report.json', JSON.stringify(report, null, 2));
  
  return report;
}

// Export for use in tests
module.exports = { AICodeAnalyzer, runAnalysis };

// Run if called directly
if (require.main === module) {
  runAnalysis().then(report => {
    console.log('🤖 AI Code Analyzer: Report saved to ai-code-analysis-report.json');
    process.exit(0);
  }).catch(error => {
    console.error('🤖 AI Code Analyzer: Error:', error);
    process.exit(1);
  });
}
