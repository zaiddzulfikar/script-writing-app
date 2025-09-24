const fs = require('fs');
const { execSync } = require('child_process');

class AIVerificationAgent {
  constructor() {
    this.verificationResults = {
      codeAnalysis: null,
      testResults: null,
      recommendations: []
    };
  }

  async verifyFixes() {
    console.log('🤖 AI Verification Agent: Starting verification process...');
    
    // Step 1: Verify code fixes
    await this.verifyCodeFixes();
    
    // Step 2: Run tests
    await this.runTests();
    
    // Step 3: Generate verification report
    return this.generateVerificationReport();
  }

  async verifyCodeFixes() {
    console.log('🤖 AI Verification Agent: Verifying code fixes...');
    
    const filePath = 'app/projects/project/page.tsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    const verification = {
      raceConditionFixed: !content.includes('setEpisodeSelectionLocked(false)'),
      debuggingAdded: content.includes('=== EPISODE CREATED DEBUG ==='),
      debouncingImproved: content.includes('timeSinceLastSnapshot < 300'),
      stateValidationAdded: content.includes('episodeSelectionLocked && pendingNewEpisodeId'),
      urlUpdatePresent: content.includes('url.searchParams.set(\'episodeId\', newEpisodeId)')
    };
    
    console.log('🤖 AI Verification Agent: Code verification results:', verification);
    
    this.verificationResults.codeAnalysis = verification;
  }

  async runTests() {
    console.log('🤖 AI Verification Agent: Running tests...');
    
    try {
      // Run Playwright tests
      console.log('🤖 AI Verification Agent: Running Playwright tests...');
      const testOutput = execSync('npx playwright test tests/smart-ai-agent.spec.ts --project=chromium --reporter=json', {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 60000
      });
      
      this.verificationResults.testResults = {
        status: 'passed',
        output: testOutput.toString()
      };
      
      console.log('✅ Playwright tests passed');
      
    } catch (error) {
      console.log('❌ Playwright tests failed:', error.message);
      
      this.verificationResults.testResults = {
        status: 'failed',
        error: error.message,
        output: error.stdout?.toString() || ''
      };
    }
  }

  generateVerificationReport() {
    console.log('🤖 AI Verification Agent: Generating verification report...');
    
    const codeAnalysis = this.verificationResults.codeAnalysis;
    const testResults = this.verificationResults.testResults;
    
    // Calculate overall success
    const codeFixesSuccess = codeAnalysis ? 
      Object.values(codeAnalysis).filter(Boolean).length / Object.keys(codeAnalysis).length : 0;
    
    const testsSuccess = testResults?.status === 'passed' ? 1 : 0;
    
    const overallSuccess = (codeFixesSuccess + testsSuccess) / 2;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        overallSuccess: Math.round(overallSuccess * 100),
        codeFixesSuccess: Math.round(codeFixesSuccess * 100),
        testsSuccess: Math.round(testsSuccess * 100),
        status: overallSuccess > 0.8 ? 'SUCCESS' : 'NEEDS_ATTENTION'
      },
      codeAnalysis: codeAnalysis,
      testResults: testResults,
      recommendations: this.generateRecommendations(codeAnalysis, testResults),
      nextSteps: this.generateNextSteps(overallSuccess)
    };
    
    return report;
  }

  generateRecommendations(codeAnalysis, testResults) {
    const recommendations = [];
    
    if (codeAnalysis) {
      if (!codeAnalysis.raceConditionFixed) {
        recommendations.push({
          priority: 'critical',
          title: 'Fix Race Condition',
          description: 'Remove setEpisodeSelectionLocked(false) from handleEpisodeCreated function',
          status: 'pending'
        });
      }
      
      if (!codeAnalysis.debuggingAdded) {
        recommendations.push({
          priority: 'medium',
          title: 'Add Debugging',
          description: 'Add comprehensive debugging logs to track episode selection',
          status: 'pending'
        });
      }
      
      if (!codeAnalysis.debouncingImproved) {
        recommendations.push({
          priority: 'high',
          title: 'Improve Debouncing',
          description: 'Increase onSnapshot debouncing time to prevent rapid triggers',
          status: 'pending'
        });
      }
    }
    
    if (testResults?.status === 'failed') {
      recommendations.push({
        priority: 'high',
        title: 'Fix Test Failures',
        description: 'Address test failures to ensure episode selection works correctly',
        status: 'pending'
      });
    }
    
    return recommendations;
  }

  generateNextSteps(overallSuccess) {
    if (overallSuccess > 0.8) {
      return [
        '✅ Episode selection issue has been resolved',
        '🧪 Run manual testing to verify episode creation and chat functionality',
        '📊 Monitor console logs for any remaining issues',
        '🚀 Deploy the fixes to production'
      ];
    } else {
      return [
        '🔧 Apply remaining code fixes',
        '🧪 Fix test failures',
        '🔄 Re-run verification process',
        '📋 Review and address all recommendations'
      ];
    }
  }
}

// Run verification
async function runVerification() {
  const verificationAgent = new AIVerificationAgent();
  
  try {
    const report = await verificationAgent.verifyFixes();
    
    console.log('🤖 AI Verification Agent: Verification complete!');
    console.log('Summary:', report.summary);
    console.log('Status:', report.summary.status);
    
    // Save report
    fs.writeFileSync('ai-verification-report.json', JSON.stringify(report, null, 2));
    
    return report;
  } catch (error) {
    console.error('🤖 AI Verification Agent: Error during verification:', error);
    throw error;
  }
}

// Export for use in tests
module.exports = { AIVerificationAgent, runVerification };

// Run if called directly
if (require.main === module) {
  runVerification().then(report => {
    console.log('🤖 AI Verification Agent: Report saved to ai-verification-report.json');
    process.exit(0);
  }).catch(error => {
    console.error('🤖 AI Verification Agent: Error:', error);
    process.exit(1);
  });
}
