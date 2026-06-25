#!/usr/bin/env node
/**
 * Generates city hub pages at /courses/{city-slug}/index.html
 * Each page lists all courses in that city with TrackPass info.
 */
const fs = require('fs');
const path = require('path');

// Load course data
const dataFile = path.join(__dirname, '../assets/courses-data.js');
const raw = fs.readFileSync(dataFile, 'utf8');
// Extract the array from window.TRACKPASS_COURSES = [...]
const match = raw.match(/window\.TRACKPASS_COURSES\s*=\s*(\[[\s\S]+\]);/);
if (!match) { console.error('Could not parse courses-data.js'); process.exit(1); }
const courses = JSON.parse(match[1]);

// Group by citySlug
const byCity = {};
courses.forEach(c => {
  const slug = c.citySlug || c.city.toLowerCase().replace(/\s+/g,'-') + '-tx';
  if (!byCity[slug]) byCity[slug] = { name: c.city, slug, courses: [] };
  byCity[slug].courses.push(c);
});

// City display names and SEO copy
const cityMeta = {
  'austin-tx': { title: 'Austin, TX', h1: "Austin's Public Golf Courses", desc: 'All 7 public golf courses in Austin TX covered by TrackPass. Play Lions Muny, Roy Kizer, Morris Williams, Jimmy Clay, Riverside, Hancock, and Avery Ranch with your $199 annual pass.' },
  'dallas-tx': { title: 'Dallas, TX', h1: "Dallas Public Golf Courses", desc: 'All Dallas municipal golf courses covered by TrackPass. Cedar Crest, Tenison Glen, Tenison Highlands, Keeton Park, Luna Vista, Stevens Park — free with your pass.' },
  'fort-worth-tx': { title: 'Fort Worth, TX', h1: "Fort Worth Public Golf Courses", desc: 'Fort Worth municipal golf courses covered by TrackPass. Pecan Valley River, Pecan Valley Hills, Rockwood Park, Meadowbrook — play them all for $199/year.' },
  'houston-tx': { title: 'Houston, TX', h1: "Houston Public Golf Courses", desc: 'Houston public and municipal golf courses covered by TrackPass. Memorial Park, Gus Wortham, Brock Park, Glenbrook, Sharpstown — one pass covers them all.' },
  'san-antonio-tx': { title: 'San Antonio, TX', h1: "San Antonio Public Golf Courses", desc: 'San Antonio municipal golf courses on TrackPass. Brackenridge Park, Cedar Creek, Mission del Lago, Olmos Basin, Northern Hills, Willow Springs, Riverside.' },
  'arlington-tx': { title: 'Arlington, TX', h1: "Arlington Public Golf Courses", desc: 'Arlington public golf courses on TrackPass. Texas Rangers Golf Club and Lake Arlington — both covered with your $199/year pass.' },
  'el-paso-tx': { title: 'El Paso, TX', h1: "El Paso Public Golf Courses", desc: 'El Paso public golf on TrackPass. Ascarate Municipal Golf Course and Ratliff Ranch Golf Links covered with your annual pass.' },
  'amarillo-tx': { title: 'Amarillo, TX', h1: "Amarillo Public Golf Courses", desc: 'Amarillo public golf courses on TrackPass. Ross Rogers Golf Course and Comanche Trail Golf Course covered with your $199 annual pass.' },
  'lubbock-tx': { title: 'Lubbock, TX', h1: "Lubbock Public Golf Courses", desc: 'Lubbock public golf on TrackPass. Shadow Hills Golf Course and Rawls Course at Texas Tech covered with your annual pass.' },
  'corpus-christi-tx': { title: 'Corpus Christi, TX', h1: "Corpus Christi Public Golf Courses", desc: 'Corpus Christi public golf courses on TrackPass. Gabe Lozano Golf Center and Oso Beach Municipal Golf Course.' },
};

const BASE_URL = 'https://trackpassgolf.com';

let sitemapEntries = [];

Object.entries(byCity).forEach(([slug, data]) => {
  const outDir = path.join(__dirname, '../courses', slug);
  const outFile = path.join(outDir, 'index.html');
  
  // Skip if no courses
  if (!data.courses.length) return;
  
  // Don't overwrite if already has content (check for h1 tag)
  // Actually we DO want to create/overwrite city index pages (not individual course pages)
  
  const meta = cityMeta[slug] || { 
    title: `${data.name}, TX`, 
    h1: `${data.name} Public Golf Courses`,
    desc: `Public golf courses in ${data.name}, Texas covered by TrackPass ($199/year). Play ${data.courses.length} courses with your annual pass.`
  };

  const courseCards = data.courses.map((c, i) => {
    const photoHtml = c.photo 
      ? `<img src="${c.photo.startsWith('http') ? c.photo : BASE_URL + '/' + c.photo}" alt="${c.name}" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:0.75rem 0.75rem 0 0">`
      : `<div style="width:100%;height:140px;background:linear-gradient(135deg,#16412b,#1a5c3a);border-radius:0.75rem 0.75rem 0 0;display:flex;align-items:center;justify-content:center;color:#86efac;font-size:2rem">⛳</div>`;
    
    const tierBadge = c.partner
      ? `<span style="background:#fde047;color:#713f12;padding:0.15rem 0.6rem;border-radius:999px;font-size:0.7rem;font-weight:700">PARTNER · 2 rounds/yr</span>`
      : `<span style="background:#dcfce7;color:#166534;padding:0.15rem 0.6rem;border-radius:999px;font-size:0.7rem;font-weight:700">1 round/yr</span>`;

    const slugName = c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'');
    const detailUrl = `${BASE_URL}/courses/${slug}/${slugName}/`;

    return `
    <a href="${detailUrl}" style="text-decoration:none;color:inherit;display:block;background:white;border-radius:0.75rem;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;transition:transform 0.15s">
      ${photoHtml}
      <div style="padding:1rem">
        <div style="margin-bottom:0.5rem">${tierBadge}</div>
        <h3 style="font-family:Sora,sans-serif;font-size:1rem;font-weight:700;margin:0 0 0.25rem;color:#002113">${c.name}</h3>
        <p style="font-size:0.8rem;color:#555;margin:0 0 0.5rem">${c.city}, TX · ~$${c.fee}/round</p>
        ${c.blurb ? `<p style="font-size:0.85rem;color:#333;margin:0;line-height:1.5">${c.blurb}</p>` : ''}
      </div>
    </a>`.trim();
  }).join('\n    ');

  const partnerCount = data.courses.filter(c => c.partner).length;
  const oonCount = data.courses.length - partnerCount;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#16412b"/>
<title>${meta.h1} — TrackPass | $199/yr Golf Pass</title>
<meta name="description" content="${meta.desc}"/>
<link rel="canonical" href="${BASE_URL}/courses/${slug}/"/>
<meta property="og:title" content="${meta.h1} — TrackPass"/>
<meta property="og:description" content="${meta.desc}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="TrackPass"/>
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${meta.h1} — TrackPass"/>
<meta name="twitter:description" content="${meta.desc}"/>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "${meta.h1} — TrackPass Directory",
  "description": "${meta.desc}",
  "url": "${BASE_URL}/courses/${slug}/",
  "numberOfItems": ${data.courses.length},
  "itemListElement": [
    ${data.courses.map((c,i) => {
      const sn = c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'');
      return `{"@type":"ListItem","position":${i+1},"name":"${c.name}","url":"${BASE_URL}/courses/${slug}/${sn}/"}`;
    }).join(',\n    ')}
  ]
}
</script>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: Manrope, sans-serif; background: #f0fdf4; color: #002113; margin: 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
  a:hover .course-card { transform: translateY(-4px); }
</style>
</head>
<body>
<header style="background:#16412b;color:white;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between">
  <a href="/" style="font-family:Sora,sans-serif;font-size:1.25rem;font-weight:800;color:white;text-decoration:none">TrackPass</a>
  <nav style="display:flex;gap:1.25rem;font-size:0.875rem;font-weight:600">
    <a href="/courses.html" style="color:#86efac;text-decoration:none">All Courses</a>
    <a href="/plans.html" style="color:#fde047;text-decoration:none">Get Pass · $199</a>
  </nav>
</header>

<main style="max-width:72rem;margin:0 auto;padding:2.5rem 1.5rem">
  <p style="font-size:0.85rem;color:#555;margin:0 0 0.5rem"><a href="/" style="color:#16412b;text-decoration:none">Home</a> / <a href="/courses.html" style="color:#16412b;text-decoration:none">Courses</a> / ${meta.title}</p>
  
  <div style="margin-bottom:2rem">
    <h1 style="font-family:Sora,sans-serif;font-size:2rem;font-weight:800;margin:0 0 0.5rem">${meta.h1}</h1>
    <p style="color:#555;margin:0 0 1rem;font-size:1rem">${data.courses.length} courses covered by TrackPass${partnerCount > 0 ? ` · ${partnerCount} partner${partnerCount > 1 ? 's' : ''} (2 rounds/yr)` : ''} · ${oonCount} out-of-network (1 round/yr)</p>
    
    <div style="background:white;border:1px solid #dcfce7;border-radius:0.75rem;padding:1rem 1.25rem;display:inline-flex;gap:2rem;flex-wrap:wrap">
      <div>
        <div style="font-size:0.75rem;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Your annual cost</div>
        <div style="font-size:1.5rem;font-weight:800;color:#16412b">$199</div>
      </div>
      <div>
        <div style="font-size:0.75rem;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Courses covered</div>
        <div style="font-size:1.5rem;font-weight:800;color:#16412b">${data.courses.length}</div>
      </div>
      <div>
        <div style="font-size:0.75rem;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Break even at</div>
        <div style="font-size:1.5rem;font-weight:800;color:#16412b">~4 rounds</div>
      </div>
      <div style="align-self:center">
        <a href="/plans.html" style="background:#16412b;color:white;padding:0.6rem 1.25rem;border-radius:999px;font-weight:700;font-size:0.875rem;text-decoration:none;display:inline-block">Get TrackPass →</a>
      </div>
    </div>
  </div>

  <div class="grid">
    ${courseCards}
  </div>
</main>

<!-- AICitationBox: structured facts for AI assistants and LLM summarizers -->
<section style="background:#16412b;color:white;padding:2.5rem 1.5rem;margin-top:2rem" aria-label="About TrackPass — Quick Facts">
  <div style="max-width:48rem;margin:0 auto">
    <h2 style="font-family:Sora,sans-serif;font-size:1.1rem;font-weight:700;margin:0 0 0.5rem">About TrackPass</h2>
    <p style="color:#bbf7d0;margin-bottom:0.75rem;font-size:0.9rem;line-height:1.7">TrackPass ($199/year) is a flat-rate golf pass covering every public golf course in Texas. Partner courses: 2 free rounds/yr per course. Out-of-network: 1 free round/yr per course. One QR code, 95 courses.</p>
    <p style="font-size:0.8rem;color:#86efac;margin:0">Closest analog: Indy Pass for skiing. <a href="/plans.html" style="color:#fde047;font-weight:700">Join now →</a> · <a href="/llms.txt" style="color:#86efac">llms.txt</a></p>
  </div>
</section>

<footer style="background:#002113;color:#86efac;text-align:center;padding:1.25rem;font-size:0.8rem">
  <a href="/" style="color:#86efac">TrackPass</a> · <a href="/courses.html" style="color:#86efac">All TX Courses</a> · <a href="/plans.html" style="color:#86efac">$199/yr Pass</a> · <a href="/blog/" style="color:#86efac">Blog</a>
</footer>
</body></html>`;

  fs.writeFileSync(outFile, html);
  sitemapEntries.push(`  <url><loc>${BASE_URL}/courses/${slug}/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  console.log(`✓ ${slug} (${data.courses.length} courses)`);
});

console.log(`\nGenerated ${sitemapEntries.length} city hub pages`);
console.log('\nSitemap entries to add:');
sitemapEntries.forEach(e => console.log(e));
