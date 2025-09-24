import { test, expect, Page } from '@playwright/test';

test('Simple Episode Selection Test', async ({ page }) => {
  console.log('🤖 AI Agent: Starting simple episode selection test...');
  
  // Navigate to app
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if we're on login page or dashboard
  const currentUrl = page.url();
  console.log('🤖 AI Agent: Current URL:', currentUrl);
  
  if (currentUrl.includes('/auth/login')) {
    console.log('🤖 AI Agent: On login page, attempting to login...');
    
    // Try to login (you may need to adjust credentials)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/dashboard', { timeout: 10000 });
  }
  
  // Navigate to dashboard if not already there
  if (!currentUrl.includes('/dashboard')) {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  }
  
  console.log('🤖 AI Agent: On dashboard, looking for projects...');
  
  // Look for existing projects or create one
  const projectCards = page.locator('.card');
  const projectCount = await projectCards.count();
  
  if (projectCount > 0) {
    console.log(`🤖 AI Agent: Found ${projectCount} projects, clicking first one...`);
    
    // Click first project
    await projectCards.first().click();
    await page.waitForURL(/\/projects\/project\?id=/, { timeout: 10000 });
    
    console.log('🤖 AI Agent: On project page, looking for episodes...');
    
    // Wait for episodes to load
    await page.waitForSelector('.sidebar-item', { timeout: 10000 });
    
    // Look for add episode button
    const addEpisodeButton = page.locator('[title="Tambah Episode"]');
    if (await addEpisodeButton.isVisible()) {
      console.log('🤖 AI Agent: Found add episode button, creating episode...');
      
      // Monitor console logs
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      });
      
      // Click add episode button
      await addEpisodeButton.click();
      
      // Wait for modal
      await page.waitForSelector('input[name="title"]', { timeout: 5000 });
      
      // Fill episode form
      await page.fill('input[name="title"]', 'AI Agent Test Episode');
      await page.fill('input[name="setting"]', 'Test Setting');
      await page.fill('input[name="duration"]', '30');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for episode creation
      await page.waitForTimeout(3000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log('🤖 AI Agent: Current URL after episode creation:', currentUrl);
      
      // Check if episodeId is in URL
      const hasEpisodeId = currentUrl.includes('episodeId=');
      console.log('🤖 AI Agent: URL contains episodeId:', hasEpisodeId);
      
      // Look for active episode in sidebar
      const activeEpisode = page.locator('.sidebar-item.active');
      const activeEpisodeCount = await activeEpisode.count();
      console.log('🤖 AI Agent: Active episodes found:', activeEpisodeCount);
      
      // Check console logs for episode-related messages
      const episodeLogs = consoleLogs.filter(log => 
        log.includes('episode') || 
        log.includes('EPISODE') || 
        log.includes('CONDITION') ||
        log.includes('redirect')
      );
      
      console.log('🤖 AI Agent: Episode-related console logs:', episodeLogs);
      
      // Check for redirect issues
      const redirectLogs = consoleLogs.filter(log => 
        log.includes('redirect') || 
        log.includes('episode 1') ||
        log.includes('first episode')
      );
      
      if (redirectLogs.length > 0) {
        console.log('🚨 AI Agent: REDIRECT ISSUE DETECTED!');
        console.log('Redirect logs:', redirectLogs);
      }
      
      // Try to send a chat message
      const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
      if (await chatInput.isVisible()) {
        console.log('🤖 AI Agent: Found chat input, sending test message...');
        
        await chatInput.fill('Test message from AI agent');
        await page.click('button[type="submit"], button:has-text("Send")');
        
        // Wait a bit and check if we're still on the same episode
        await page.waitForTimeout(2000);
        
        const finalUrl = page.url();
        console.log('🤖 AI Agent: Final URL after chat:', finalUrl);
        
        // Check if URL changed (indicating redirect)
        if (finalUrl !== currentUrl) {
          console.log('🚨 AI Agent: URL CHANGED AFTER CHAT - POSSIBLE REDIRECT!');
          console.log('Original URL:', currentUrl);
          console.log('Final URL:', finalUrl);
        }
      }
      
      // Generate test report
      const testReport = {
        episodeCreated: true,
        urlContainsEpisodeId: hasEpisodeId,
        activeEpisodesFound: activeEpisodeCount,
        redirectLogsFound: redirectLogs.length > 0,
        redirectLogs: redirectLogs,
        episodeLogs: episodeLogs,
        finalUrl: page.url()
      };
      
      console.log('🤖 AI Agent: Test report:', testReport);
      
      // Save report
      const fs = require('fs');
      fs.writeFileSync('ai-agent-test-report.json', JSON.stringify(testReport, null, 2));
      
      // Assert no redirect issues
      expect(redirectLogs.length).toBe(0);
      
    } else {
      console.log('🤖 AI Agent: Add episode button not found');
    }
  } else {
    console.log('🤖 AI Agent: No projects found');
  }
});
