const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Start from GolfPass homepage
  await page.goto('https://www.golfpass.com/travel-advisor/courses/', 
    { timeout: 25000, waitUntil: 'networkidle' });
  
  const url = page.url();
  const title = await page.title();
  const text = await page.evaluate(() => document.body.innerText.slice(0, 400));
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href*="/courses/"]')).map(a => ({text: a.textContent.trim(), href: a.href})).slice(0,10));
  const forms = await page.evaluate(() => Array.from(document.querySelectorAll('input[type="text"],input[type="search"],input[placeholder]')).map(i => ({placeholder: i.placeholder, name: i.name, id: i.id})));
  
  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Body:', text.replace(/\n/g,' ').slice(0,300));
  console.log('Links:', JSON.stringify(links, null, 2));
  console.log('Forms:', JSON.stringify(forms, null, 2));
  
  await browser.close();
})();
