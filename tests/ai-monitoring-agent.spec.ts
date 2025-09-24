import { test, expect, Page } from '@playwright/test';

class AIMonitoringAgent {
  private page: Page;
  private monitoringData: any = {
    episodeCreations: [],
    episodeSelections: [],
    redirects: [],
    consoleLogs: [],
    networkRequests: []
  };

  constructor(page: Page) {
    this.page = page;
  }

  async startRealTimeMonitoring() {
    console.log('🤖 AI Monitoring Agent: Starting real-time monitoring...');
    
    // Setup monitoring
    await this.setupMonitoring();
    
    // Start monitoring loop
    await this.monitoringLoop();
    
    return this.monitoringData;
  }

  private async setupMonitoring() {
    // Monitor console logs
    this.page.on('console', msg => {
      const logEntry = {
        timestamp: Date.now(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      };
      
      this.monitoringData.consoleLogs.push(logEntry);
      
      // Detect episode-related logs
      if (this.isEpisodeRelatedLog(msg.text())) {
        this.analyzeEpisodeLog(msg.text());
      }
    });

    // Monitor network requests
    this.page.on('request', request => {
      const requestEntry = {
        timestamp: Date.now(),
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      };
      
      this.monitoringData.networkRequests.push(requestEntry);
    });

    // Monitor page navigation
    this.page.on('response', response => {
      if (response.url().includes('episodes') || response.url().includes('chatMessages')) {
        console.log('🤖 AI Monitoring Agent: Episode-related response detected:', response.url());
      }
    });
  }

  private isEpisodeRelatedLog(logText: string): boolean {
    const episodeKeywords = [
      'episode', 'EPISODE', 'Episode',
      'CONDITION', 'condition',
      'redirect', 'REDIRECT',
      'onSnapshot', 'fetchEpisodes',
      'handleEpisodeCreated', 'setSelectedEpisode'
    ];
    
    return episodeKeywords.some(keyword => logText.includes(keyword));
  }

  private analyzeEpisodeLog(logText: string) {
    const timestamp = Date.now();
    
    // Detect episode creation
    if (logText.includes('EPISODE CREATED DEBUG')) {
      this.monitoringData.episodeCreations.push({
        timestamp,
        log: logText,
        type: 'creation'
      });
      console.log('🤖 AI Monitoring Agent: Episode creation detected');
    }
    
    // Detect episode selection
    if (logText.includes('Found target episode') || logText.includes('selecting it')) {
      this.monitoringData.episodeSelections.push({
        timestamp,
        log: logText,
        type: 'selection'
      });
      console.log('🤖 AI Monitoring Agent: Episode selection detected');
    }
    
    // Detect redirects
    if (logText.includes('redirect') || logText.includes('episode 1') || logText.includes('first episode')) {
      this.monitoringData.redirects.push({
        timestamp,
        log: logText,
        type: 'redirect'
      });
      console.log('🚨 AI Monitoring Agent: Potential redirect detected!');
    }
  }

  private async monitoringLoop() {
    console.log('🤖 AI Monitoring Agent: Starting monitoring loop...');
    
    // Navigate to app
    await this.page.goto('/');
    
    // Wait for app to load
    await this.page.waitForLoadState('networkidle');
    
    // Simulate user interactions
    await this.simulateUserInteractions();
    
    // Continue monitoring for a bit
    await this.page.waitForTimeout(5000);
  }

  private async simulateUserInteractions() {
    console.log('🤖 AI Monitoring Agent: Simulating user interactions...');
    
    try {
      // Try to login if needed
      const loginButton = this.page.locator('text=Masuk');
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await this.page.fill('input[type="email"]', 'test@example.com');
        await this.page.fill('input[type="password"]', 'password123');
        await this.page.click('button[type="submit"]');
        await this.page.waitForURL('/dashboard');
      }
      
      // Navigate to a project
      const projectCard = this.page.locator('.card').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        await this.page.waitForURL(/\/projects\/project\?id=/);
        
        // Try to create an episode
        const addEpisodeButton = this.page.locator('[title="Tambah Episode"]');
        if (await addEpisodeButton.isVisible()) {
          await addEpisodeButton.click();
          
          // Fill episode form
          await this.page.fill('input[name="title"]', 'AI Agent Test Episode');
          await this.page.fill('input[name="setting"]', 'Test Setting');
          await this.page.fill('input[name="duration"]', '30');
          
          // Submit form
          await this.page.click('button[type="submit"]');
          
          // Wait for episode creation
          await this.page.waitForTimeout(3000);
          
          // Try to send a chat message
          const chatInput = this.page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
          if (await chatInput.isVisible()) {
            await chatInput.fill('Test message from AI agent');
            await this.page.click('button[type="submit"], button:has-text("Send")');
            await this.page.waitForTimeout(2000);
          }
        }
      }
    } catch (error) {
      console.log('🤖 AI Monitoring Agent: Error during simulation:', error);
    }
  }

  generateReport() {
    console.log('🤖 AI Monitoring Agent: Generating monitoring report...');
    
    const report = {
      summary: {
        totalEpisodeCreations: this.monitoringData.episodeCreations.length,
        totalEpisodeSelections: this.monitoringData.episodeSelections.length,
        totalRedirects: this.monitoringData.redirects.length,
        totalConsoleLogs: this.monitoringData.consoleLogs.length,
        totalNetworkRequests: this.monitoringData.networkRequests.length
      },
      issues: [],
      recommendations: []
    };

    // Analyze for issues
    if (this.monitoringData.redirects.length > 0) {
      report.issues.push({
        type: 'redirect_issue',
        count: this.monitoringData.redirects.length,
        description: 'Redirects to episode 1 detected',
        logs: this.monitoringData.redirects
      });
    }

    // Generate recommendations
    if (report.issues.length > 0) {
      report.recommendations.push('Check episode selection logic for race conditions');
      report.recommendations.push('Verify handleEpisodeCreated function implementation');
      report.recommendations.push('Review onSnapshot debouncing mechanism');
    }

    return report;
  }
}

test('AI Monitoring Agent for Episode Selection', async ({ page }) => {
  const monitoringAgent = new AIMonitoringAgent(page);
  
  const monitoringData = await monitoringAgent.startRealTimeMonitoring();
  const report = monitoringAgent.generateReport();
  
  console.log('🤖 AI Monitoring Agent: Monitoring complete!');
  console.log('Report:', report);
  
  // Save monitoring data
  const fs = require('fs');
  fs.writeFileSync('ai-monitoring-report.json', JSON.stringify({
    monitoringData,
    report
  }, null, 2));
  
  // Assert no critical issues
  expect(report.issues.filter(issue => issue.type === 'redirect_issue').length).toBe(0);
});
