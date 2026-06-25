const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Try a GolfPass city page 
  await page.goto('https://www.golfpass.com/travel-advisor/texas/san-antonio-golf-courses/', 
    { timeout: 20000, waitUntil: 'networkidle' });
  
  const url = page.url();
  const title = await page.title();
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href*="/courses/"]')).map(a => a.href).slice(0,10));
  
  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Course links:', links.join('\n'));
  
  await browser.close();
})();
