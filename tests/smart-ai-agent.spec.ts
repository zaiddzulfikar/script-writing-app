import { test, expect, Page } from '@playwright/test';

class SmartAIAgent {
  private page: Page;
  private consoleLogs: string[] = [];
  private analysisResults: any = {};

  constructor(page: Page) {
    this.page = page;
  }

  async analyzeAndTestEpisodeSelection() {
    console.log('🤖 Smart AI Agent: Starting intelligent analysis...');
    
    // Setup monitoring
    await this.setupMonitoring();
    
    // Navigate and analyze UI
    await this.navigateAndAnalyzeUI();
    
    // Test episode selection issue
    await this.testEpisodeSelectionIssue();
    
    // Generate analysis report
    return this.generateAnalysisReport();
  }

  private async setupMonitoring() {
    // Monitor console logs
    this.page.on('console', msg => {
      this.consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Monitor network requests
    this.page.on('request', request => {
      if (request.url().includes('episodes') || request.url().includes('chatMessages')) {
        console.log('🤖 Smart AI Agent: Episode-related request:', request.url());
      }
    });
  }

  private async navigateAndAnalyzeUI() {
    console.log('🤖 Smart AI Agent: Navigating and analyzing UI...');
    
    // Navigate to app
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    
    // Take screenshot for analysis
    await this.page.screenshot({ path: 'ui-analysis-1.png' });
    
    // Analyze current page
    const currentUrl = this.page.url();
    console.log('🤖 Smart AI Agent: Current URL:', currentUrl);
    
    // Check if we need to login
    if (currentUrl.includes('/auth/login')) {
      console.log('🤖 Smart AI Agent: On login page, attempting login...');
      await this.attemptLogin();
    }
    
    // Navigate to dashboard
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
    
    // Take screenshot of dashboard
    await this.page.screenshot({ path: 'ui-analysis-2.png' });
    
    // Analyze dashboard UI
    await this.analyzeDashboardUI();
  }

  private async attemptLogin() {
    try {
      // Try different login selectors
      const emailInput = this.page.locator('input[type="email"], input[name="email"]');
      const passwordInput = this.page.locator('input[type="password"], input[name="password"]');
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Masuk")');
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');
        await submitButton.click();
        
        // Wait for redirect
        await this.page.waitForURL('/dashboard', { timeout: 10000 });
        console.log('🤖 Smart AI Agent: Login successful');
      }
    } catch (error) {
      console.log('🤖 Smart AI Agent: Login failed:', error);
    }
  }

  private async analyzeDashboardUI() {
    console.log('🤖 Smart AI Agent: Analyzing dashboard UI...');
    
    // Look for create project button with different selectors
    const createProjectSelectors = [
      'text=Buat Proyek Baru',
      'button:has-text("Buat Proyek")',
      'button:has-text("Create Project")',
      '[data-testid="create-project"]',
      '.create-project-button',
      'button[aria-label*="project"]'
    ];
    
    let createProjectButton = null;
    for (const selector of createProjectSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          createProjectButton = element;
          console.log(`🤖 Smart AI Agent: Found create project button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (createProjectButton) {
      console.log('🤖 Smart AI Agent: Create project button found, clicking...');
      await createProjectButton.click();
      
      // Wait for modal
      await this.page.waitForSelector('input[name="title"], input[placeholder*="title"]', { timeout: 5000 });
      
      // Fill project form
      await this.fillProjectForm();
      
      // Submit form
      await this.page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Create")');
      
      // Wait for redirect
      await this.page.waitForURL(/\/projects\/project\?id=/, { timeout: 10000 });
      
      console.log('🤖 Smart AI Agent: Project created successfully');
    } else {
      console.log('🤖 Smart AI Agent: Create project button not found, looking for existing projects...');
      
      // Look for existing projects
      const projectSelectors = [
        '.card',
        '.project-card',
        '[data-testid="project-card"]',
        '.project-item'
      ];
      
      let projectCard = null;
      for (const selector of projectSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible()) {
            projectCard = element;
            console.log(`🤖 Smart AI Agent: Found project card with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (projectCard) {
        console.log('🤖 Smart AI Agent: Clicking existing project...');
        await projectCard.click();
        await this.page.waitForURL(/\/projects\/project\?id=/, { timeout: 10000 });
      } else {
        console.log('🤖 Smart AI Agent: No projects found');
        throw new Error('No projects found and cannot create new project');
      }
    }
  }

  private async fillProjectForm() {
    console.log('🤖 Smart AI Agent: Filling project form...');
    
    // Fill form fields with different selectors
    const titleSelectors = ['input[name="title"]', 'input[placeholder*="title"]', 'input[placeholder*="name"]'];
    const genreSelectors = ['input[name="genre"]', 'input[placeholder*="genre"]', 'select[name="genre"]'];
    const descriptionSelectors = ['textarea[name="description"]', 'textarea[placeholder*="description"]'];
    
    // Fill title
    for (const selector of titleSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          await element.fill('AI Agent Test Project');
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Fill genre
    for (const selector of genreSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          await element.fill('Drama');
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Fill description
    for (const selector of descriptionSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          await element.fill('Test project created by AI agent');
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
  }

  private async testEpisodeSelectionIssue() {
    console.log('🤖 Smart AI Agent: Testing episode selection issue...');
    
    // Wait for project page to load
    await this.page.waitForSelector('.sidebar-item, [title="Tambah Episode"]', { timeout: 10000 });
    
    // Clear console logs before testing
    this.consoleLogs = [];
    
    // Create first episode
    console.log('🤖 Smart AI Agent: Creating first episode...');
    await this.createEpisode('Episode 1 - AI Test');
    
    // Wait and check URL
    await this.page.waitForTimeout(2000);
    const urlAfterFirstEpisode = this.page.url();
    console.log('🤖 Smart AI Agent: URL after first episode:', urlAfterFirstEpisode);
    
    // Create second episode
    console.log('🤖 Smart AI Agent: Creating second episode...');
    await this.createEpisode('Episode 2 - AI Test');
    
    // Wait and check URL
    await this.page.waitForTimeout(2000);
    const urlAfterSecondEpisode = this.page.url();
    console.log('🤖 Smart AI Agent: URL after second episode:', urlAfterSecondEpisode);
    
    // Test chat functionality
    await this.testChatFunctionality();
    
    // Analyze results
    this.analysisResults = {
      urlAfterFirstEpisode,
      urlAfterSecondEpisode,
      finalUrl: this.page.url(),
      consoleLogs: this.consoleLogs
    };
  }

  private async createEpisode(title: string) {
    // Look for add episode button
    const addEpisodeSelectors = [
      '[title="Tambah Episode"]',
      'button:has-text("Tambah Episode")',
      'button:has-text("Add Episode")',
      '[data-testid="add-episode"]',
      '.add-episode-button'
    ];
    
    let addEpisodeButton = null;
    for (const selector of addEpisodeSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          addEpisodeButton = element;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (addEpisodeButton) {
      await addEpisodeButton.click();
      
      // Wait for modal
      await this.page.waitForSelector('input[name="title"], input[placeholder*="title"]', { timeout: 5000 });
      
      // Fill episode form
      const titleInput = this.page.locator('input[name="title"], input[placeholder*="title"]');
      const settingInput = this.page.locator('input[name="setting"], input[placeholder*="setting"]');
      const durationInput = this.page.locator('input[name="duration"], input[placeholder*="duration"]');
      
      await titleInput.fill(title);
      await settingInput.fill('Test Setting');
      await durationInput.fill('30');
      
      // Submit form
      await this.page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Create")');
      
      // Wait for episode creation
      await this.page.waitForTimeout(2000);
    }
  }

  private async testChatFunctionality() {
    console.log('🤖 Smart AI Agent: Testing chat functionality...');
    
    // Look for chat input
    const chatInputSelectors = [
      'input[placeholder*="message"]',
      'textarea[placeholder*="message"]',
      'input[placeholder*="chat"]',
      'textarea[placeholder*="chat"]',
      '[data-testid="chat-input"]',
      '.chat-input'
    ];
    
    let chatInput = null;
    for (const selector of chatInputSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          chatInput = element;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (chatInput) {
      console.log('🤖 Smart AI Agent: Found chat input, sending test message...');
      
      const urlBeforeChat = this.page.url();
      await chatInput.fill('Test message from AI agent');
      
      // Look for send button
      const sendButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("Send")',
        'button:has-text("Kirim")',
        '[data-testid="send-button"]',
        '.send-button'
      ];
      
      let sendButton = null;
      for (const selector of sendButtonSelectors) {
        try {
          const element = this.page.locator(selector);
          if (await element.isVisible()) {
            sendButton = element;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (sendButton) {
        await sendButton.click();
        
        // Wait and check if URL changed
        await this.page.waitForTimeout(3000);
        const urlAfterChat = this.page.url();
        
        if (urlAfterChat !== urlBeforeChat) {
          console.log('🚨 Smart AI Agent: URL CHANGED AFTER CHAT!');
          console.log('URL before chat:', urlBeforeChat);
          console.log('URL after chat:', urlAfterChat);
        }
      }
    }
  }

  private generateAnalysisReport() {
    console.log('🤖 Smart AI Agent: Generating analysis report...');
    
    // Analyze console logs
    const episodeLogs = this.consoleLogs.filter(log => 
      log.includes('episode') || 
      log.includes('EPISODE') || 
      log.includes('CONDITION') ||
      log.includes('redirect') ||
      log.includes('onSnapshot') ||
      log.includes('fetchEpisodes')
    );
    
    const redirectLogs = this.consoleLogs.filter(log => 
      log.includes('redirect') || 
      log.includes('episode 1') ||
      log.includes('first episode') ||
      log.includes('AUTO-SELECT FIRST EPISODE')
    );
    
    const raceConditionLogs = this.consoleLogs.filter(log => 
      log.includes('setEpisodeSelectionLocked(false)') ||
      log.includes('Unlock to allow new episode selection')
    );
    
    const report = {
      timestamp: new Date().toISOString(),
      analysis: {
        totalConsoleLogs: this.consoleLogs.length,
        episodeRelatedLogs: episodeLogs.length,
        redirectLogs: redirectLogs.length,
        raceConditionLogs: raceConditionLogs.length,
        issues: {
          redirectDetected: redirectLogs.length > 0,
          raceConditionDetected: raceConditionLogs.length > 0,
        }
      },
      results: this.analysisResults,
      logs: {
        redirectLogs,
        raceConditionLogs,
        allEpisodeLogs: episodeLogs
      },
      recommendations: []
    };
    
    // Generate recommendations
    if (report.analysis.issues.redirectDetected) {
      report.recommendations.push('Check episode selection logic for redirect issues');
    }
    
    if (report.analysis.issues.raceConditionDetected) {
      report.recommendations.push('Remove setEpisodeSelectionLocked(false) from handleEpisodeCreated');
    }
    
    if (report.analysis.issues.redirectDetected || report.analysis.issues.raceConditionDetected) {
      report.recommendations.push('Review onSnapshot debouncing mechanism');
      report.recommendations.push('Implement episode selection state machine');
    }
    
    return report;
  }
}

test('Smart AI Agent Episode Selection Analysis', async ({ page }) => {
  const smartAgent = new SmartAIAgent(page);
  
  const report = await smartAgent.analyzeAndTestEpisodeSelection();
  
  console.log('🤖 Smart AI Agent: Analysis complete!');
  console.log('Report:', report);
  
  // Save report
  const fs = require('fs');
  fs.writeFileSync('smart-ai-agent-report.json', JSON.stringify(report, null, 2));
  
  // Assertions
  expect(report.analysis.issues.redirectDetected).toBe(false);
  expect(report.analysis.issues.raceConditionDetected).toBe(false);
});
