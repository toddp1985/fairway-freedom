const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // The page loaded before from Austin - try it with a specific lat/lng
  await page.goto('https://www.golfpass.com/travel-advisor/courses-near-you', 
    { timeout: 30000, waitUntil: 'networkidle' });
  
  const title = await page.title();
  console.log('Loaded:', title);
  
  // Try filling location input slowly
  const locInput = await page.$('#location');
  if (locInput) {
    await locInput.click();
    await locInput.fill('');
    await page.keyboard.type('Waco, TX', { delay: 50 });
    await page.waitForTimeout(1000);
    
    // Look for autocomplete dropdown
    const suggestions = await page.evaluate(() => 
      Array.from(document.querySelectorAll('[class*="suggestion"], [class*="autocomplete"], [role="option"], [class*="dropdown"] li'))
        .map(el => el.textContent.trim())
        .slice(0,5)
    );
    console.log('Suggestions:', suggestions);
    
    // Press Enter to search
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);
    
    const courseLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href*="/travel-advisor/courses/"]'))
        .filter(a => !a.href.includes('#') && a.textContent.trim().length > 3)
        .map(a => ({ text: a.textContent.trim().slice(0,40), href: a.href }))
        .slice(0, 10)
    );
    console.log('Waco courses:', JSON.stringify(courseLinks, null, 2));
  } else {
    console.log('No location input found');
  }
  
  await browser.close();
})();
