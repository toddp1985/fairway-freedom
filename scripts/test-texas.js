const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.golfpass.com/travel-advisor/texas/', 
    { timeout: 25000, waitUntil: 'networkidle' });
  
  const url = page.url();
  const title = await page.title();
  const links = await page.evaluate(() => 
    Array.from(document.querySelectorAll('a[href*="/courses/"]'))
      .filter(a => a.textContent.trim().length > 3)
      .map(a => ({ text: a.textContent.trim().slice(0,50), href: a.href }))
      .slice(0,15)
  );
  const cityLinks = await page.evaluate(() => 
    Array.from(document.querySelectorAll('a[href*="/texas/"]'))
      .map(a => ({ text: a.textContent.trim().slice(0,50), href: a.href }))
      .slice(0,20)
  );
  
  console.log('URL:', url, '| Title:', title);
  console.log('Course links:', JSON.stringify(links, null, 2));
  console.log('City links:', JSON.stringify(cityLinks, null, 2));
  
  await browser.close();
})();
