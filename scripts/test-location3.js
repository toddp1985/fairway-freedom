const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  
  await page.goto('https://www.golfpass.com/travel-advisor/courses-near-you', 
    { timeout: 30000, waitUntil: 'networkidle' });
  
  // Take screenshot and look at all inputs + their visibility
  const inputs = await page.evaluate(() => 
    Array.from(document.querySelectorAll('input')).map(i => ({
      name: i.name, id: i.id, placeholder: i.placeholder,
      visible: i.offsetParent !== null,
      display: window.getComputedStyle(i).display,
      visibility: window.getComputedStyle(i).visibility
    }))
  );
  console.log('All inputs:', JSON.stringify(inputs, null, 2));
  
  // Try to click on the page title/heading area to reveal search
  const buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button, [role="button"]'))
      .filter(b => b.offsetParent !== null)
      .map(b => ({ text: b.textContent.trim().slice(0,30), class: b.className.slice(0,40) }))
      .slice(0,10)
  );
  console.log('Visible buttons:', JSON.stringify(buttons));
  
  await browser.close();
})();
