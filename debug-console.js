import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  // Navigate to the page
  console.log('Navigating to http://localhost:5174...');
  await page.goto('http://localhost:5174');
  
  // Wait a bit to let everything load
  await page.waitForTimeout(3000);
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-screenshot.png' });
  
  // Get page content
  const content = await page.content();
  console.log('\n--- PAGE CONTENT ---');
  console.log(content.substring(0, 1000) + '...');
  
  await browser.close();
})();