const { chromium } = require('playwright');

class AIManualTestingAgent {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async startManualTesting() {
    console.log('🤖 AI Manual Testing Agent: Starting manual testing...');
    
    try {
      // Launch browser
      this.browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 // Slow down for better visibility
      });
      
      this.page = await this.browser.newPage();
      
      // Navigate to app
      await this.page.goto('http://localhost:3000');
      await this.page.waitForLoadState('networkidle');
      
      console.log('🤖 AI Manual Testing Agent: Browser launched and navigated to app');
      
      // Run tests
      await this.runEpisodeSelectionTests();
      
      // Generate report
      return this.generateTestReport();
      
    } catch (error) {
      console.error('🤖 AI Manual Testing Agent: Error during testing:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async runEpisodeSelectionTests() {
    console.log('🤖 AI Manual Testing Agent: Running episode selection tests...');
    
    // Test 1: Navigate to dashboard and create project
    await this.testProjectCreation();
    
    // Test 2: Create first episode
    await this.testFirstEpisodeCreation();
    
    // Test 3: Create second episode and verify selection
    await this.testSecondEpisodeCreation();
    
    // Test 4: Test chat functionality
    await this.testChatFunctionality();
    
    // Test 5: Create third episode
    await this.testThirdEpisodeCreation();
  }

  async testProjectCreation() {
    console.log('🤖 AI Manual Testing Agent: Testing project creation...');
    
    try {
      // Navigate to dashboard
      await this.page.goto('http://localhost:3000/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Look for create project button
      const createProjectButton = this.page.locator('text=Buat Proyek Baru').first();
      
      if (await createProjectButton.isVisible()) {
        await createProjectButton.click();
        await this.page.waitForSelector('input[name="title"]', { timeout: 5000 });
        
        // Fill project form
        await this.page.fill('input[name="title"]', 'AI Agent Test Project');
        await this.page.fill('input[name="genre"]', 'Drama');
        await this.page.fill('textarea[name="description"]', 'Test project created by AI agent');
        await this.page.fill('input[name="totalEpisodes"]', '5');
        await this.page.fill('input[name="mainCharacters"]', 'Character 1, Character 2');
        await this.page.fill('input[name="tone"]', 'Serious');
        await this.page.fill('input[name="targetAudience"]', 'Adults');
        
        // Submit form
        await this.page.click('button[type="submit"]');
        
        // Wait for redirect to project page
        await this.page.waitForURL(/\/projects\/project\?id=/, { timeout: 10000 });
        
        this.testResults.push({
          test: 'Project Creation',
          status: 'PASSED',
          details: 'Project created successfully and redirected to project page'
        });
        
        console.log('✅ Project creation test passed');
      } else {
        // Look for existing projects
        const projectCard = this.page.locator('.card').first();
        if (await projectCard.isVisible()) {
          await projectCard.click();
          await this.page.waitForURL(/\/projects\/project\?id=/, { timeout: 10000 });
          
          this.testResults.push({
            test: 'Project Navigation',
            status: 'PASSED',
            details: 'Navigated to existing project successfully'
          });
          
          console.log('✅ Project navigation test passed');
        } else {
          throw new Error('No projects found and cannot create new project');
        }
      }
    } catch (error) {
      this.testResults.push({
        test: 'Project Creation',
        status: 'FAILED',
        details: error.message
      });
      console.log('❌ Project creation test failed:', error.message);
    }
  }

  async testFirstEpisodeCreation() {
    console.log('🤖 AI Manual Testing Agent: Testing first episode creation...');
    
    try {
      // Wait for project page to load
      await this.page.waitForSelector('[title="Tambah Episode"]', { timeout: 10000 });
      
      // Create first episode
      await this.page.click('[title="Tambah Episode"]');
      await this.page.waitForSelector('input[name="title"]', { timeout: 5000 });
      
      // Fill episode form
      await this.page.fill('input[name="title"]', 'Episode 1 - AI Test');
      await this.page.fill('input[name="setting"]', 'Test Setting 1');
      await this.page.fill('input[name="duration"]', '30');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for episode creation
      await this.page.waitForTimeout(3000);
      
      // Check URL
      const url = this.page.url();
      const hasEpisodeId = url.includes('episodeId=');
      
      // Check if episode is selected in sidebar
      const activeEpisode = this.page.locator('.sidebar-item.active');
      const activeEpisodeCount = await activeEpisode.count();
      
      this.testResults.push({
        test: 'First Episode Creation',
        status: hasEpisodeId && activeEpisodeCount > 0 ? 'PASSED' : 'FAILED',
        details: `URL contains episodeId: ${hasEpisodeId}, Active episodes: ${activeEpisodeCount}`,
        url: url
      });
      
      console.log(`✅ First episode creation test: ${hasEpisodeId && activeEpisodeCount > 0 ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      this.testResults.push({
        test: 'First Episode Creation',
        status: 'FAILED',
        details: error.message
      });
      console.log('❌ First episode creation test failed:', error.message);
    }
  }

  async testSecondEpisodeCreation() {
    console.log('🤖 AI Manual Testing Agent: Testing second episode creation...');
    
    try {
      // Get URL before creating second episode
      const urlBeforeSecondEpisode = this.page.url();
      
      // Create second episode
      await this.page.click('[title="Tambah Episode"]');
      await this.page.waitForSelector('input[name="title"]', { timeout: 5000 });
      
      // Fill episode form
      await this.page.fill('input[name="title"]', 'Episode 2 - AI Test');
      await this.page.fill('input[name="setting"]', 'Test Setting 2');
      await this.page.fill('input[name="duration"]', '30');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for episode creation
      await this.page.waitForTimeout(3000);
      
      // Check URL after second episode creation
      const urlAfterSecondEpisode = this.page.url();
      
      // Check if we're on the correct episode (should be episode 2, not episode 1)
      const isOnEpisode2 = urlAfterSecondEpisode.includes('episodeId=') && 
                          !urlAfterSecondEpisode.includes('episodeId=first') &&
                          urlAfterSecondEpisode !== urlBeforeSecondEpisode;
      
      // Check if episode 2 is selected in sidebar
      const activeEpisode = this.page.locator('.sidebar-item.active');
      const activeEpisodeText = await activeEpisode.textContent();
      const isEpisode2Selected = activeEpisodeText && activeEpisodeText.includes('Episode 2');
      
      this.testResults.push({
        test: 'Second Episode Creation',
        status: isOnEpisode2 && isEpisode2Selected ? 'PASSED' : 'FAILED',
        details: `On episode 2: ${isOnEpisode2}, Episode 2 selected: ${isEpisode2Selected}`,
        urlBefore: urlBeforeSecondEpisode,
        urlAfter: urlAfterSecondEpisode,
        activeEpisodeText: activeEpisodeText
      });
      
      console.log(`✅ Second episode creation test: ${isOnEpisode2 && isEpisode2Selected ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      this.testResults.push({
        test: 'Second Episode Creation',
        status: 'FAILED',
        details: error.message
      });
      console.log('❌ Second episode creation test failed:', error.message);
    }
  }

  async testChatFunctionality() {
    console.log('🤖 AI Manual Testing Agent: Testing chat functionality...');
    
    try {
      // Get URL before chat
      const urlBeforeChat = this.page.url();
      
      // Look for chat input
      const chatInput = this.page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
      
      if (await chatInput.isVisible()) {
        // Send test message
        await chatInput.fill('Test message from AI agent');
        
        // Look for send button
        const sendButton = this.page.locator('button[type="submit"], button:has-text("Send")').first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
          
          // Wait for message to be sent
          await this.page.waitForTimeout(3000);
          
          // Check if URL changed (indicating redirect)
          const urlAfterChat = this.page.url();
          const urlChanged = urlAfterChat !== urlBeforeChat;
          
          this.testResults.push({
            test: 'Chat Functionality',
            status: !urlChanged ? 'PASSED' : 'FAILED',
            details: `URL changed after chat: ${urlChanged}`,
            urlBefore: urlBeforeChat,
            urlAfter: urlAfterChat
          });
          
          console.log(`✅ Chat functionality test: ${!urlChanged ? 'PASSED' : 'FAILED'}`);
        } else {
          this.testResults.push({
            test: 'Chat Functionality',
            status: 'SKIPPED',
            details: 'Send button not found'
          });
          console.log('⏭️ Chat functionality test skipped - send button not found');
        }
      } else {
        this.testResults.push({
          test: 'Chat Functionality',
          status: 'SKIPPED',
          details: 'Chat input not found'
        });
        console.log('⏭️ Chat functionality test skipped - chat input not found');
      }
    } catch (error) {
      this.testResults.push({
        test: 'Chat Functionality',
        status: 'FAILED',
        details: error.message
      });
      console.log('❌ Chat functionality test failed:', error.message);
    }
  }

  async testThirdEpisodeCreation() {
    console.log('🤖 AI Manual Testing Agent: Testing third episode creation...');
    
    try {
      // Get URL before creating third episode
      const urlBeforeThirdEpisode = this.page.url();
      
      // Create third episode
      await this.page.click('[title="Tambah Episode"]');
      await this.page.waitForSelector('input[name="title"]', { timeout: 5000 });
      
      // Fill episode form
      await this.page.fill('input[name="title"]', 'Episode 3 - AI Test');
      await this.page.fill('input[name="setting"]', 'Test Setting 3');
      await this.page.fill('input[name="duration"]', '30');
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for episode creation
      await this.page.waitForTimeout(3000);
      
      // Check URL after third episode creation
      const urlAfterThirdEpisode = this.page.url();
      
      // Check if we're on the correct episode (should be episode 3)
      const isOnEpisode3 = urlAfterThirdEpisode.includes('episodeId=') && 
                          !urlAfterThirdEpisode.includes('episodeId=first') &&
                          urlAfterThirdEpisode !== urlBeforeThirdEpisode;
      
      // Check if episode 3 is selected in sidebar
      const activeEpisode = this.page.locator('.sidebar-item.active');
      const activeEpisodeText = await activeEpisode.textContent();
      const isEpisode3Selected = activeEpisodeText && activeEpisodeText.includes('Episode 3');
      
      this.testResults.push({
        test: 'Third Episode Creation',
        status: isOnEpisode3 && isEpisode3Selected ? 'PASSED' : 'FAILED',
        details: `On episode 3: ${isOnEpisode3}, Episode 3 selected: ${isEpisode3Selected}`,
        urlBefore: urlBeforeThirdEpisode,
        urlAfter: urlAfterThirdEpisode,
        activeEpisodeText: activeEpisodeText
      });
      
      console.log(`✅ Third episode creation test: ${isOnEpisode3 && isEpisode3Selected ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      this.testResults.push({
        test: 'Third Episode Creation',
        status: 'FAILED',
        details: error.message
      });
      console.log('❌ Third episode creation test failed:', error.message);
    }
  }

  generateTestReport() {
    const passedTests = this.testResults.filter(test => test.status === 'PASSED').length;
    const failedTests = this.testResults.filter(test => test.status === 'FAILED').length;
    const skippedTests = this.testResults.filter(test => test.status === 'SKIPPED').length;
    const totalTests = this.testResults.length;
    
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        successRate: Math.round(successRate)
      },
      testResults: this.testResults,
      overallStatus: successRate >= 80 ? 'SUCCESS' : 'NEEDS_ATTENTION',
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(test => test.status === 'FAILED');
    
    if (failedTests.length > 0) {
      recommendations.push('Review failed tests and check console logs for errors');
      recommendations.push('Verify that all episode selection fixes are properly applied');
    }
    
    if (this.testResults.some(test => test.status === 'SKIPPED')) {
      recommendations.push('Review skipped tests and ensure all UI elements are accessible');
    }
    
    const successRate = this.testResults.filter(test => test.status === 'PASSED').length / this.testResults.length * 100;
    
    if (successRate >= 80) {
      recommendations.push('✅ Episode selection issue appears to be resolved');
      recommendations.push('🧪 Continue monitoring in production environment');
    } else {
      recommendations.push('🔧 Additional fixes may be needed');
      recommendations.push('📊 Review test results and apply additional fixes');
    }
    
    return recommendations;
  }
}

// Run manual testing
async function runManualTesting() {
  const testingAgent = new AIManualTestingAgent();
  
  try {
    const report = await testingAgent.startManualTesting();
    
    console.log('🤖 AI Manual Testing Agent: Testing complete!');
    console.log('Summary:', report.summary);
    console.log('Overall Status:', report.overallStatus);
    
    // Save report
    const fs = require('fs');
    fs.writeFileSync('ai-manual-testing-report.json', JSON.stringify(report, null, 2));
    
    return report;
  } catch (error) {
    console.error('🤖 AI Manual Testing Agent: Error during testing:', error);
    throw error;
  }
}

// Export for use in tests
module.exports = { AIManualTestingAgent, runManualTesting };

// Run if called directly
if (require.main === module) {
  runManualTesting().then(report => {
    console.log('🤖 AI Manual Testing Agent: Report saved to ai-manual-testing-report.json');
    process.exit(0);
  }).catch(error => {
    console.error('🤖 AI Manual Testing Agent: Error:', error);
    process.exit(1);
  });
}
