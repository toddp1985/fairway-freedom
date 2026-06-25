const { chromium } = require('playwright');
const fs = require('fs');

const raw = fs.readFileSync('assets/courses-data.js', 'utf8');
eval(raw.replace('window.TRACKPASS_COURSES', 'global.TRACKPASS_COURSES'));
const missing = global.TRACKPASS_COURSES.filter(c => !c.photo);

function normalize(s) { 
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(); 
}

// Group by city
const cityCourses = {};
for (const c of missing) {
  if (!cityCourses[c.city]) cityCourses[c.city] = [];
  cityCourses[c.city].push(c);
}
const cities = Object.keys(cityCourses);
console.error(`${cities.length} distinct cities, ${missing.length} courses missing photos`);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  for (const city of cities) {
    const page = await browser.newPage();
    try {
      await page.goto('https://www.golfpass.com/travel-advisor/courses-near-you',
        { timeout: 30000, waitUntil: 'networkidle' });

      // Click the "Change" button to reveal the location input
      await page.click('#changeButton', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // Now the location input should be visible
      await page.fill('#location', city + ', TX');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(4000);

      const courseLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href*="/travel-advisor/courses/"]'))
          .filter(a => !a.href.includes('#') && a.textContent.trim().length > 3)
          .map(a => ({ text: a.textContent.trim(), href: a.href }))
          .filter((v, i, arr) => arr.findIndex(x => x.href === v.href) === i)
          .slice(0, 25)
      );

      console.error(`  ${city}: ${courseLinks.length} courses found`);

      // Match each target to best link — each target and each link used at most once
      const targets = cityCourses[city];
      const matched = [];
      const usedHrefs = new Set();
      const matchedIds = new Set();
      for (const target of targets) {
        if (matchedIds.has(target.id)) continue;
        const words = normalize(target.name).split(' ').filter(w => w.length > 3);
        let bestLink = null, bestScore = 0;
        for (const link of courseLinks) {
          if (usedHrefs.has(link.href)) continue;
          const linkNorm = normalize(link.text + ' ' + link.href);
          const score = words.filter(w => linkNorm.includes(w)).length;
          if (score > bestScore && score >= Math.max(2, Math.ceil(words.length * 0.6))) {
            bestScore = score;
            bestLink = link;
          }
        }
        if (bestLink) {
          matched.push({ course: target, url: bestLink.href });
          usedHrefs.add(bestLink.href);
          matchedIds.add(target.id);
        }
      }

      console.error(`  ${city}: ${matched.length}/${targets.length} matched`);

      // Fetch photos for matched courses
      for (const { course, url } of matched) {
        const p2 = await browser.newPage();
        try {
          await p2.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });
          await p2.waitForTimeout(1500);
          const photo = await p2.evaluate(() => {
            const meta = document.querySelector('meta[property="og:image"]');
            return meta ? meta.content : null;
          });
          if (photo && photo.includes('brightspot')) {
            const decoded = decodeURIComponent(photo);
            const s3 = decoded.match(/https?:\/\/golf-pass-brightspot\.s3\.amazonaws\.com\/[^\s"'&]*/);
            results[course.id] = s3 ? s3[0] : photo;
            console.error(`  ✓ ${course.name}`);
          }
        } finally {
          await p2.close();
        }
      }
    } catch (e) {
      console.error(`  ✗ ${city}: ${e.message.slice(0, 80)}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
