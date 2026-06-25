const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to homepage
  await page.goto('https://www.golfpass.com/', { timeout: 25000, waitUntil: 'networkidle' });
  
  // Find and use the vendor search handler
  const searchInput = await page.$('[name="vendor-search-handler"]');
  if (searchInput) {
    await searchInput.fill('Cottonwood Creek Waco Texas');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href*="/courses/"]'))
        .map(a => ({ text: a.textContent.trim().slice(0,50), href: a.href }))
        .slice(0, 10)
    );
    console.log('Results:', JSON.stringify(links, null, 2));
  } else {
    console.log('No search input found');
    const inputs = await page.evaluate(() => 
      Array.from(document.querySelectorAll('input')).map(i => ({name: i.name, placeholder: i.placeholder, id: i.id}))
    );
    console.log('Inputs:', JSON.stringify(inputs));
  }
  
  await browser.close();
})();
