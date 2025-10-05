/**
 * PromoForge Workflow Test Script
 * Tests the complete workflow and captures all errors
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function testPromoForgeWorkflow() {
  const errors = [];
  const warnings = [];
  const networkFailures = [];
  const consoleMessages = [];

  console.log('🚀 Starting PromoForge workflow test...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for visual inspection
    slowMo: 1000, // Slow down by 1 second for better observation
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './test-videos/',
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Capture console messages
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text, timestamp: new Date().toISOString() });

    console.log(`📝 Console [${type}]: ${text}`);

    if (type === 'error') {
      errors.push({ source: 'Console Error', message: text, timestamp: new Date().toISOString() });
    } else if (type === 'warning') {
      warnings.push({ source: 'Console Warning', message: text, timestamp: new Date().toISOString() });
    }
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.log(`❌ Page Error: ${error.message}`);
    errors.push({
      source: 'Page Error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Monitor network requests
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();

    if (status >= 400) {
      console.log(`🔴 Network Failure: ${status} - ${url}`);

      let responseBody = '';
      try {
        responseBody = await response.text();
      } catch (e) {
        responseBody = 'Could not read response body';
      }

      networkFailures.push({
        url,
        status,
        statusText: response.statusText(),
        body: responseBody,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`✅ Network Success: ${status} - ${url}`);
    }
  });

  try {
    console.log('📱 Opening http://localhost:3000...\n');

    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    // Take initial screenshot
    await page.screenshot({ path: './screenshots/01-initial-load.png', fullPage: true });
    console.log('📸 Screenshot: 01-initial-load.png\n');

    // Wait a bit for page to settle
    await page.waitForTimeout(2000);

    console.log('🔍 Testing URL input...\n');

    // Find and fill URL input (it's just a regular text input with placeholder)
    const urlInput = await page.locator('input[placeholder*="example.com"]').first();
    await urlInput.waitFor({ state: 'visible', timeout: 10000 });
    await urlInput.fill('https://example.com');
    await page.screenshot({ path: './screenshots/02-url-entered.png', fullPage: true });
    console.log('📸 Screenshot: 02-url-entered.png\n');

    console.log('🔍 Looking for Analyze & Extract button...\n');

    // Try to find the "Analyze & Extract" button
    const analyzeButton = await page.locator('button:has-text("Analyze"), button:has-text("Extract"), button:has-text("Analyze & Extract")').first();

    if (await analyzeButton.isVisible()) {
      console.log('✅ Found Analyze button, clicking...\n');

      // Click the analyze button
      await analyzeButton.click();

      // Wait for network activity
      await page.waitForTimeout(3000);

      await page.screenshot({ path: './screenshots/03-after-analyze-click.png', fullPage: true });
      console.log('📸 Screenshot: 03-after-analyze-click.png\n');

      console.log('⏳ Waiting for screenshots to load (10 seconds)...\n');

      // Wait for potential screenshot loading
      await page.waitForTimeout(10000);

      await page.screenshot({ path: './screenshots/04-screenshots-loaded.png', fullPage: true });
      console.log('📸 Screenshot: 04-screenshots-loaded.png\n');

      console.log('🔍 Looking for audio settings...\n');

      // Try to find audio settings (voice selection, speed, etc.)
      const audioSettings = await page.locator('select, input[type="range"], [class*="audio"], [class*="voice"]').all();
      console.log(`📊 Found ${audioSettings.length} potential audio control elements\n`);

      // Take screenshot of audio settings area
      await page.screenshot({ path: './screenshots/05-audio-settings.png', fullPage: true });
      console.log('📸 Screenshot: 05-audio-settings.png\n');

      console.log('🔍 Looking for Generate Video button...\n');

      // Look for generate button
      const generateButton = await page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Video")').first();

      if (await generateButton.isVisible()) {
        console.log('✅ Found Generate Video button, clicking...\n');

        await generateButton.click();

        // Wait for generation process
        await page.waitForTimeout(5000);

        await page.screenshot({ path: './screenshots/06-after-generate-click.png', fullPage: true });
        console.log('📸 Screenshot: 06-after-generate-click.png\n');

        // Wait longer to capture any generation errors
        await page.waitForTimeout(10000);

        await page.screenshot({ path: './screenshots/07-generation-result.png', fullPage: true });
        console.log('📸 Screenshot: 07-generation-result.png\n');
      } else {
        console.log('⚠️  Generate Video button not found\n');
      }
    } else {
      console.log('⚠️  Analyze & Extract button not found\n');
    }

    // Capture final state
    await page.screenshot({ path: './screenshots/08-final-state.png', fullPage: true });
    console.log('📸 Screenshot: 08-final-state.png\n');

    // Check for any error messages on page
    const errorElements = await page.locator('[class*="error"], [role="alert"], .text-red-500, .text-destructive').all();
    for (const el of errorElements) {
      const text = await el.textContent();
      if (text && text.trim()) {
        console.log(`🔴 UI Error Message: ${text}`);
        errors.push({ source: 'UI Error Message', message: text, timestamp: new Date().toISOString() });
      }
    }

  } catch (error) {
    console.log(`❌ Test Error: ${error.message}`);
    errors.push({ source: 'Test Script Error', message: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    await page.screenshot({ path: './screenshots/error-state.png', fullPage: true });
  }

  // Generate comprehensive report
  const report = {
    testDate: new Date().toISOString(),
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalNetworkFailures: networkFailures.length,
      totalConsoleMessages: consoleMessages.length
    },
    errors,
    warnings,
    networkFailures,
    consoleMessages
  };

  // Save report to file
  fs.writeFileSync('./test-report.json', JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST REPORT SUMMARY');
  console.log('='.repeat(80));
  console.log(`❌ Total Errors: ${errors.length}`);
  console.log(`⚠️  Total Warnings: ${warnings.length}`);
  console.log(`🔴 Network Failures: ${networkFailures.length}`);
  console.log(`📝 Console Messages: ${consoleMessages.length}`);
  console.log('\n📄 Full report saved to: test-report.json');
  console.log('📸 Screenshots saved to: ./screenshots/');
  console.log('='.repeat(80) + '\n');

  if (errors.length > 0) {
    console.log('🔴 ERRORS FOUND:');
    errors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. [${err.source}] ${err.message}`);
      if (err.stack) {
        console.log(`   Stack: ${err.stack.substring(0, 200)}...`);
      }
    });
  }

  if (networkFailures.length > 0) {
    console.log('\n\n🔴 NETWORK FAILURES:');
    networkFailures.forEach((fail, idx) => {
      console.log(`\n${idx + 1}. ${fail.status} - ${fail.url}`);
      console.log(`   Response: ${fail.body.substring(0, 200)}...`);
    });
  }

  await browser.close();

  return report;
}

// Create directories if they don't exist
if (!fs.existsSync('./screenshots')) fs.mkdirSync('./screenshots');
if (!fs.existsSync('./test-videos')) fs.mkdirSync('./test-videos');

// Run the test
testPromoForgeWorkflow()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
