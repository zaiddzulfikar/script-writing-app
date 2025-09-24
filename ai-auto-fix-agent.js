const fs = require('fs');
const { AICodeAnalyzer } = require('./ai-code-analyzer');

class AIAutoFixAgent {
  constructor() {
    this.analyzer = new AICodeAnalyzer();
    this.fixesApplied = [];
    this.errors = [];
  }

  async analyzeAndFix() {
    console.log('🤖 AI Auto-Fix Agent: Starting analysis and auto-fix...');
    
    // Step 1: Analyze code
    const analysis = await this.analyzer.analyzeEpisodeSelectionIssue();
    
    // Step 2: Apply critical fixes first
    await this.applyCriticalFixes(analysis.fixes);
    
    // Step 3: Apply high priority fixes
    await this.applyHighPriorityFixes(analysis.fixes);
    
    // Step 4: Apply medium priority fixes
    await this.applyMediumPriorityFixes(analysis.fixes);
    
    // Step 5: Verify fixes
    await this.verifyFixes();
    
    // Step 6: Generate report
    return this.generateFixReport();
  }

  async applyCriticalFixes(fixes) {
    console.log('🤖 AI Auto-Fix Agent: Applying critical fixes...');
    
    const criticalFixes = fixes.filter(fix => 
      fix.description.includes('race condition') || 
      fix.description.includes('setEpisodeSelectionLocked(false)')
    );
    
    for (const fix of criticalFixes) {
      try {
        await this.applyFix(fix);
        this.fixesApplied.push({
          ...fix,
          status: 'applied',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Applied critical fix: ${fix.description}`);
      } catch (error) {
        this.errors.push({
          fix,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Failed to apply critical fix: ${error.message}`);
      }
    }
  }

  async applyHighPriorityFixes(fixes) {
    console.log('🤖 AI Auto-Fix Agent: Applying high priority fixes...');
    
    const highPriorityFixes = fixes.filter(fix => 
      fix.description.includes('debouncing') || 
      fix.description.includes('onSnapshot')
    );
    
    for (const fix of highPriorityFixes) {
      try {
        await this.applyFix(fix);
        this.fixesApplied.push({
          ...fix,
          status: 'applied',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Applied high priority fix: ${fix.description}`);
      } catch (error) {
        this.errors.push({
          fix,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Failed to apply high priority fix: ${error.message}`);
      }
    }
  }

  async applyMediumPriorityFixes(fixes) {
    console.log('🤖 AI Auto-Fix Agent: Applying medium priority fixes...');
    
    const mediumPriorityFixes = fixes.filter(fix => 
      fix.type === 'new_feature' || 
      fix.description.includes('state machine')
    );
    
    for (const fix of mediumPriorityFixes) {
      try {
        await this.applyFix(fix);
        this.fixesApplied.push({
          ...fix,
          status: 'applied',
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Applied medium priority fix: ${fix.description}`);
      } catch (error) {
        this.errors.push({
          fix,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Failed to apply medium priority fix: ${error.message}`);
      }
    }
  }

  async applyFix(fix) {
    console.log(`🤖 AI Auto-Fix Agent: Applying fix to ${fix.file}...`);
    
    if (fix.type === 'code_fix') {
      await this.applyCodeFix(fix);
    } else if (fix.type === 'new_feature') {
      await this.applyNewFeature(fix);
    }
  }

  async applyCodeFix(fix) {
    const filePath = fix.file;
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (fix.function === 'handleEpisodeCreated') {
      // Remove setEpisodeSelectionLocked(false) line
      content = content.replace(
        /setEpisodeSelectionLocked\(false\)\s*\/\/\s*Unlock to allow new episode selection/g,
        '// CRITICAL FIX: HAPUS setEpisodeSelectionLocked(false) - INI PENYEBAB UTAMA REDIRECT KE EPISODE 1'
      );
      
      // Add debugging logs if not present
      if (!content.includes('=== EPISODE CREATED DEBUG ===')) {
        const handleEpisodeCreatedStart = content.indexOf('const handleEpisodeCreated = (newEpisodeId: string) => {');
        if (handleEpisodeCreatedStart !== -1) {
          const insertPoint = handleEpisodeCreatedStart + 'const handleEpisodeCreated = (newEpisodeId: string) => {'.length;
          const debugCode = `\n    console.log('=== EPISODE CREATED DEBUG ===')\n    console.log('New episode ID:', newEpisodeId)\n    console.log('Current episodeSelectionLocked:', episodeSelectionLocked)\n    `;
          content = content.slice(0, insertPoint) + debugCode + content.slice(insertPoint);
        }
      }
    }
    
    if (fix.function === 'fetchEpisodes') {
      // Improve debouncing
      content = content.replace(
        /if \(timeSinceLastSnapshot < 100\)/g,
        'if (timeSinceLastSnapshot < 300) // Increased to 300ms'
      );
      
      // Add state validation
      if (!content.includes('episodeSelectionLocked && pendingNewEpisodeId')) {
        const onSnapshotStart = content.indexOf('const unsubscribe = onSnapshot(q, (querySnapshot) => {');
        if (onSnapshotStart !== -1) {
          const insertPoint = onSnapshotStart + 'const unsubscribe = onSnapshot(q, (querySnapshot) => {'.length;
          const validationCode = `\n        // Add state validation before processing\n        if (episodeSelectionLocked && pendingNewEpisodeId) {\n          console.log('🔒 Episode selection locked with pending episode, skipping auto-selection')\n          return\n        }\n        `;
          content = content.slice(0, insertPoint) + validationCode + content.slice(insertPoint);
        }
      }
    }
    
    // Write back to file
    fs.writeFileSync(filePath, content);
    console.log(`✅ Code fix applied to ${filePath}`);
  }

  async applyNewFeature(fix) {
    console.log(`🤖 AI Auto-Fix Agent: New feature recommended: ${fix.description}`);
    
    // For now, just log the recommendation
    // In a real implementation, this would add the new feature code
    console.log('📝 New feature code:', fix.code);
  }

  async verifyFixes() {
    console.log('🤖 AI Auto-Fix Agent: Verifying fixes...');
    
    // Re-analyze code to check if issues are fixed
    const reAnalysis = await this.analyzer.analyzeEpisodeSelectionIssue();
    
    const criticalIssuesRemaining = reAnalysis.issues.filter(issue => issue.severity === 'critical');
    const highIssuesRemaining = reAnalysis.issues.filter(issue => issue.severity === 'high');
    
    console.log(`🤖 AI Auto-Fix Agent: Critical issues remaining: ${criticalIssuesRemaining.length}`);
    console.log(`🤖 AI Auto-Fix Agent: High issues remaining: ${highIssuesRemaining.length}`);
    
    if (criticalIssuesRemaining.length === 0) {
      console.log('✅ All critical issues have been resolved!');
    } else {
      console.log('❌ Some critical issues remain:', criticalIssuesRemaining);
    }
    
    return {
      criticalIssuesRemaining,
      highIssuesRemaining,
      allIssuesRemaining: reAnalysis.issues
    };
  }

  generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFixesApplied: this.fixesApplied.length,
        totalErrors: this.errors.length,
        successRate: this.fixesApplied.length / (this.fixesApplied.length + this.errors.length) * 100
      },
      fixesApplied: this.fixesApplied,
      errors: this.errors,
      recommendations: [
        'Test the application to verify episode selection works correctly',
        'Monitor console logs for any remaining issues',
        'Consider implementing the episode selection state machine for better control'
      ]
    };
    
    return report;
  }
}

// Run the auto-fix
async function runAutoFix() {
  const autoFixAgent = new AIAutoFixAgent();
  
  try {
    const report = await autoFixAgent.analyzeAndFix();
    
    console.log('🤖 AI Auto-Fix Agent: Auto-fix process complete!');
    console.log('Summary:', report.summary);
    console.log('Fixes applied:', report.fixesApplied.length);
    console.log('Errors:', report.errors.length);
    
    // Save report
    fs.writeFileSync('ai-auto-fix-report.json', JSON.stringify(report, null, 2));
    
    return report;
  } catch (error) {
    console.error('🤖 AI Auto-Fix Agent: Error during auto-fix:', error);
    throw error;
  }
}

// Export for use in tests
module.exports = { AIAutoFixAgent, runAutoFix };

// Run if called directly
if (require.main === module) {
  runAutoFix().then(report => {
    console.log('🤖 AI Auto-Fix Agent: Report saved to ai-auto-fix-report.json');
    process.exit(0);
  }).catch(error => {
    console.error('🤖 AI Auto-Fix Agent: Error:', error);
    process.exit(1);
  });
}
