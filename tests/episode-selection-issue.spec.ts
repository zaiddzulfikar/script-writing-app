import { test, expect, Page } from '@playwright/test';

class EpisodeSelectionAIAgent {
  private page: Page;
  private consoleLogs: string[] = [];
  private networkRequests: any[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async setupMonitoring() {
    // Monitor console logs
    this.page.on('console', msg => {
      this.consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Monitor network requests
    this.page.on('request', request => {
      this.networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });
  }

  async analyzeEpisodeSelectionIssue() {
    console.log('🤖 AI Agent: Starting episode selection issue analysis...');
    
    // Step 1: Navigate to app and login
    await this.navigateAndLogin();
    
    // Step 2: Create a new project
    const projectId = await this.createProject();
    
    // Step 3: Create first episode
    const firstEpisodeId = await this.createEpisode(projectId, 'Episode 1');
    
    // Step 4: Create second episode and test selection
    const secondEpisodeId = await this.createEpisode(projectId, 'Episode 2');
    
    // Step 5: Analyze the issue
    const analysis = await this.analyzeIssue();
    
    return analysis;
  }

  private async navigateAndLogin() {
    console.log('🤖 AI Agent: Navigating to app and logging in...');
    
    await this.page.goto('/');
    
    // Check if we need to login
    const loginButton = this.page.locator('a[href="/auth/login"]').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Fill login form (you may need to adjust these selectors)
      await this.page.fill('input[type="email"]', 'test@example.com');
      await this.page.fill('input[type="password"]', 'password123');
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await this.page.waitForURL('/dashboard');
    }
  }

  private async createProject(): Promise<string> {
    console.log('🤖 AI Agent: Creating new project...');
    
    // Click create project button
    await this.page.click('text=Buat Proyek Baru');
    
    // Fill project form
    await this.page.fill('input[name="title"]', 'Test Project for Episode Selection');
    await this.page.fill('input[name="genre"]', 'Drama');
    await this.page.fill('textarea[name="description"]', 'Test project to analyze episode selection issue');
    await this.page.fill('input[name="totalEpisodes"]', '5');
    await this.page.fill('input[name="mainCharacters"]', 'Character 1, Character 2');
    await this.page.fill('input[name="tone"]', 'Serious');
    await this.page.fill('input[name="targetAudience"]', 'Adults');
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for project creation and get project ID from URL
    await this.page.waitForURL(/\/projects\/project\?id=/);
    const url = this.page.url();
    const projectId = url.split('id=')[1].split('&')[0];
    
    console.log(`🤖 AI Agent: Project created with ID: ${projectId}`);
    return projectId;
  }

  private async createEpisode(projectId: string, episodeTitle: string): Promise<string> {
    console.log(`🤖 AI Agent: Creating episode: ${episodeTitle}`);
    
    // Clear console logs before episode creation
    this.consoleLogs = [];
    
    // Click add episode button
    await this.page.click('[title="Tambah Episode"]');
    
    // Fill episode form
    await this.page.fill('input[name="title"]', episodeTitle);
    await this.page.fill('input[name="setting"]', 'Test Setting');
    await this.page.fill('input[name="duration"]', '30');
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for episode creation
    await this.page.waitForSelector('.sidebar-item.active', { timeout: 10000 });
    
    // Get episode ID from URL
    const url = this.page.url();
    const episodeId = url.split('episodeId=')[1];
    
    console.log(`🤖 AI Agent: Episode created with ID: ${episodeId}`);
    
    // Wait a bit for any potential redirects
    await this.page.waitForTimeout(2000);
    
    // Check if we're still on the correct episode
    const currentUrl = this.page.url();
    const currentEpisodeId = currentUrl.split('episodeId=')[1];
    
    if (currentEpisodeId !== episodeId) {
      console.log(`🚨 AI Agent: ISSUE DETECTED! Expected episode ${episodeId}, but redirected to ${currentEpisodeId}`);
    }
    
    return episodeId;
  }

  private async analyzeIssue() {
    console.log('🤖 AI Agent: Analyzing episode selection issue...');
    
    const analysis = {
      issueDetected: false,
      consoleLogs: this.consoleLogs,
      networkRequests: this.networkRequests,
      recommendations: []
    };

    // Analyze console logs for episode selection patterns
    const episodeSelectionLogs = this.consoleLogs.filter(log => 
      log.includes('EPISODE') || 
      log.includes('episode') || 
      log.includes('CONDITION') ||
      log.includes('redirect')
    );

    console.log('🤖 AI Agent: Episode selection logs found:', episodeSelectionLogs.length);
    
    // Check for redirect patterns
    const redirectLogs = this.consoleLogs.filter(log => 
      log.includes('redirect') || 
      log.includes('episode 1') ||
      log.includes('first episode')
    );

    if (redirectLogs.length > 0) {
      analysis.issueDetected = true;
      analysis.recommendations.push('Redirect to episode 1 detected in console logs');
    }

    // Analyze network requests for episode-related calls
    const episodeRequests = this.networkRequests.filter(req => 
      req.url.includes('episodes') || 
      req.url.includes('chatMessages')
    );

    console.log('🤖 AI Agent: Episode-related network requests:', episodeRequests.length);

    // Generate recommendations based on analysis
    if (analysis.issueDetected) {
      analysis.recommendations.push('Check episode selection logic in fetchEpisodes function');
      analysis.recommendations.push('Verify handleEpisodeCreated function does not unlock episode selection');
      analysis.recommendations.push('Review onSnapshot debouncing implementation');
    }

    return analysis;
  }
}

test('Episode Selection Issue Analysis', async ({ page }) => {
  const aiAgent = new EpisodeSelectionAIAgent(page);
  await aiAgent.setupMonitoring();
  
  const analysis = await aiAgent.analyzeEpisodeSelectionIssue();
  
  console.log('🤖 AI Agent: Analysis complete!');
  console.log('Issue detected:', analysis.issueDetected);
  console.log('Recommendations:', analysis.recommendations);
  
  // Save analysis to file for further review
  const fs = require('fs');
  fs.writeFileSync('episode-selection-analysis.json', JSON.stringify(analysis, null, 2));
  
  // Assert that no redirect issue occurred
  expect(analysis.issueDetected).toBe(false);
});
