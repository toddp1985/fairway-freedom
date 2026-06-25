const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Try the search
  await page.goto('https://www.golfadvisor.com/search?term=northern+hills+golf+san+antonio+texas', 
    { timeout: 20000, waitUntil: 'networkidle' });
  
  const url = page.url();
  const title = await page.title();
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href*="/courses/"]')).map(a => a.href).slice(0,5));
  const text = await page.evaluate(() => document.body.innerText.slice(0,300));
  
  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Course links:', links);
  console.log('Body text:', text.replace(/\n/g,' ').slice(0,200));
  
  await browser.close();
})();
