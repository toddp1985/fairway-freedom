const { chromium } = require('playwright');
const fs = require('fs');

const raw = fs.readFileSync('assets/courses-data.js', 'utf8');
eval(raw.replace('window.TRACKPASS_COURSES', 'global.TRACKPASS_COURSES'));

const missing = global.TRACKPASS_COURSES.filter(c => !c.photo);
console.error(`Scraping ${missing.length} courses...`);

// Normalize name for matching
function normalize(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim(); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = {};
  const found = new Set();

  // Group courses by city so we can do one search per city
  const cityCourses = {};
  for (const c of missing) {
    if (!cityCourses[c.city]) cityCourses[c.city] = [];
    cityCourses[c.city].push(c);
  }
  const cities = Object.keys(cityCourses);
  console.error(`${cities.length} cities to search`);

  const searchPage = await browser.newPage();

  for (const city of cities) {
    if (found.size >= missing.length) break;
    try {
      await searchPage.goto('https://www.golfpass.com/travel-advisor/courses-near-you',
        { timeout: 20000, waitUntil: 'networkidle' });

      // Type city in the location input
      await searchPage.fill('#location', city + ', TX');
      await searchPage.keyboard.press('Enter');
      await searchPage.waitForTimeout(3000);

      // Collect all course links and names from the page
      const courseLinks = await searchPage.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/travel-advisor/courses/"]'))
          .filter(a => !a.href.includes('#') && a.textContent.trim().length > 3)
          .map(a => ({ href: a.href, text: a.textContent.trim() }))
          .filter((v, i, arr) => arr.findIndex(x => x.href === v.href) === i) // dedupe
          .slice(0, 30);
      });

      console.error(`  ${city}: found ${courseLinks.length} links`);

      // Match links to our missing courses
      const cityTargets = cityCourses[city];
      const matched = [];
      for (const link of courseLinks) {
        for (const target of cityTargets) {
          if (found.has(target.id)) continue;
          const linkNorm = normalize(link.text + ' ' + link.href);
          const targetNorm = normalize(target.name);
          const words = targetNorm.split(' ').filter(w => w.length > 3);
          const matchCount = words.filter(w => linkNorm.includes(w)).length;
          if (matchCount >= Math.max(1, Math.floor(words.length * 0.5))) {
            matched.push({ course: target, url: link.href });
            found.add(target.id);
            break;
          }
        }
      }

      console.error(`  ${city}: matched ${matched.length}/${cityTargets.length} courses`);

      // Fetch photos for matched courses in parallel
      await Promise.all(matched.map(async ({ course, url }) => {
        const page = await browser.newPage();
        try {
          await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(1500);
          const photo = await page.evaluate(() => {
            const meta = document.querySelector('meta[property="og:image"], meta[property="og:image:url"]');
            return meta ? meta.content : null;
          });
          if (photo && photo.length > 10 && !photo.includes('placeholder')) {
            const decoded = decodeURIComponent(photo);
            const s3match = decoded.match(/https?:\/\/golf-pass-brightspot\.s3\.amazonaws\.com\/[^\s"'&]*/);
            results[course.id] = s3match ? s3match[0] : photo;
            console.error(`  ✓ ${course.id} (${course.name}): got photo`);
          } else {
            console.error(`  - ${course.id}: no usable photo`);
          }
        } catch (e) {
          console.error(`  ✗ ${course.id}: ${e.message.slice(0,50)}`);
        } finally {
          await page.close();
        }
      }));

    } catch (e) {
      console.error(`  ✗ ${city} search failed: ${e.message.slice(0,60)}`);
    }
  }

  await searchPage.close();
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
