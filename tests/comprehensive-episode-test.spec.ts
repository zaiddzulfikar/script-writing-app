import { test, expect, Page } from '@playwright/test';

test('Comprehensive Episode Selection Test', async ({ page }) => {
  console.log('🤖 AI Agent: Starting comprehensive episode selection test...');
  
  // Navigate to app
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  console.log('🤖 AI Agent: On homepage, navigating to dashboard...');
  
  // Navigate to dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  console.log('🤖 AI Agent: On dashboard, creating new project...');
  
  // Create new project
  const createProjectButton = page.locator('text=Buat Proyek Baru');
  if (await createProjectButton.isVisible()) {
    await createProjectButton.click();
    
    // Wait for modal
    await page.waitForSelector('input[name="title"]', { timeout: 5000 });
    
    // Fill project form
    await page.fill('input[name="title"]', 'AI Agent Test Project');
    await page.fill('input[name="genre"]', 'Drama');
    await page.fill('textarea[name="description"]', 'Test project created by AI agent');
    await page.fill('input[name="totalEpisodes"]', '5');
    await page.fill('input[name="mainCharacters"]', 'Character 1, Character 2');
    await page.fill('input[name="tone"]', 'Serious');
    await page.fill('input[name="targetAudience"]', 'Adults');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to project page
    await page.waitForURL(/\/projects\/project\?id=/, { timeout: 10000 });
    
    console.log('🤖 AI Agent: Project created, now testing episode creation...');
    
    // Monitor console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Wait for project to load
    await page.waitForSelector('.sidebar-item', { timeout: 10000 });
    
    // Create first episode
    console.log('🤖 AI Agent: Creating first episode...');
    const addEpisodeButton = page.locator('[title="Tambah Episode"]');
    await addEpisodeButton.click();
    
    // Wait for modal
    await page.waitForSelector('input[name="title"]', { timeout: 5000 });
    
    // Fill episode form
    await page.fill('input[name="title"]', 'Episode 1 - AI Test');
    await page.fill('input[name="setting"]', 'Test Setting');
    await page.fill('input[name="duration"]', '30');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for episode creation
    await page.waitForTimeout(3000);
    
    // Check URL after first episode creation
    const urlAfterFirstEpisode = page.url();
    console.log('🤖 AI Agent: URL after first episode:', urlAfterFirstEpisode);
    
    // Create second episode
    console.log('🤖 AI Agent: Creating second episode...');
    await addEpisodeButton.click();
    
    // Wait for modal
    await page.waitForSelector('input[name="title"]', { timeout: 5000 });
    
    // Fill episode form
    await page.fill('input[name="title"]', 'Episode 2 - AI Test');
    await page.fill('input[name="setting"]', 'Test Setting 2');
    await page.fill('input[name="duration"]', '30');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for episode creation
    await page.waitForTimeout(3000);
    
    // Check URL after second episode creation
    const urlAfterSecondEpisode = page.url();
    console.log('🤖 AI Agent: URL after second episode:', urlAfterSecondEpisode);
    
    // Check if we're on the correct episode (should be episode 2)
    const isOnEpisode2 = urlAfterSecondEpisode.includes('episodeId=') && 
                        !urlAfterSecondEpisode.includes('episodeId=first');
    
    console.log('🤖 AI Agent: Is on episode 2:', isOnEpisode2);
    
    // Try to send a chat message
    const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
    if (await chatInput.isVisible()) {
      console.log('🤖 AI Agent: Found chat input, sending test message...');
      
      await chatInput.fill('Test message from AI agent');
      await page.click('button[type="submit"], button:has-text("Send")');
      
      // Wait a bit and check if we're still on the same episode
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log('🤖 AI Agent: Final URL after chat:', finalUrl);
      
      // Check if URL changed (indicating redirect)
      if (finalUrl !== urlAfterSecondEpisode) {
        console.log('🚨 AI Agent: URL CHANGED AFTER CHAT - POSSIBLE REDIRECT!');
        console.log('URL before chat:', urlAfterSecondEpisode);
        console.log('URL after chat:', finalUrl);
      }
    }
    
    // Analyze console logs
    const episodeLogs = consoleLogs.filter(log => 
      log.includes('episode') || 
      log.includes('EPISODE') || 
      log.includes('CONDITION') ||
      log.includes('redirect') ||
      log.includes('onSnapshot') ||
      log.includes('fetchEpisodes')
    );
    
    console.log('🤖 AI Agent: Episode-related console logs:', episodeLogs.length);
    
    // Check for specific issue patterns
    const redirectLogs = consoleLogs.filter(log => 
      log.includes('redirect') || 
      log.includes('episode 1') ||
      log.includes('first episode') ||
      log.includes('AUTO-SELECT FIRST EPISODE')
    );
    
    const raceConditionLogs = consoleLogs.filter(log => 
      log.includes('setEpisodeSelectionLocked(false)') ||
      log.includes('Unlock to allow new episode selection')
    );
    
    const onSnapshotLogs = consoleLogs.filter(log => 
      log.includes('onSnapshot') && 
      (log.includes('triggered') || log.includes('multiple'))
    );
    
    // Generate comprehensive test report
    const testReport = {
      testName: 'Comprehensive Episode Selection Test',
      timestamp: new Date().toISOString(),
      results: {
        projectCreated: true,
        firstEpisodeCreated: true,
        secondEpisodeCreated: true,
        isOnCorrectEpisode: isOnEpisode2,
        urlAfterFirstEpisode,
        urlAfterSecondEpisode,
        finalUrl: page.url(),
        chatTested: await chatInput.isVisible(),
      },
      issues: {
        redirectDetected: redirectLogs.length > 0,
        raceConditionDetected: raceConditionLogs.length > 0,
        onSnapshotIssues: onSnapshotLogs.length > 0,
      },
      logs: {
        totalConsoleLogs: consoleLogs.length,
        episodeRelatedLogs: episodeLogs.length,
        redirectLogs: redirectLogs,
        raceConditionLogs: raceConditionLogs,
        onSnapshotLogs: onSnapshotLogs,
        allEpisodeLogs: episodeLogs
      },
      recommendations: []
    };
    
    // Generate recommendations based on findings
    if (testReport.issues.redirectDetected) {
      testReport.recommendations.push('Check episode selection logic for redirect issues');
    }
    
    if (testReport.issues.raceConditionDetected) {
      testReport.recommendations.push('Remove setEpisodeSelectionLocked(false) from handleEpisodeCreated');
    }
    
    if (testReport.issues.onSnapshotIssues) {
      testReport.recommendations.push('Improve onSnapshot debouncing mechanism');
    }
    
    if (!testReport.results.isOnCorrectEpisode) {
      testReport.recommendations.push('Verify episode selection after creation');
    }
    
    console.log('🤖 AI Agent: Test report generated:', testReport);
    
    // Save report
    const fs = require('fs');
    fs.writeFileSync('comprehensive-test-report.json', JSON.stringify(testReport, null, 2));
    
    // Assertions
    expect(testReport.issues.redirectDetected).toBe(false);
    expect(testReport.issues.raceConditionDetected).toBe(false);
    expect(testReport.results.isOnCorrectEpisode).toBe(true);
    
  } else {
    console.log('🤖 AI Agent: Create project button not found');
    throw new Error('Cannot create project - button not found');
  }
});
