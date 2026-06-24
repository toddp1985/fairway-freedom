#!/usr/bin/env node
// Generates one SEO-optimized HTML page per course in /courses/
// Run: node gen-course-pages.js

const fs = require('fs');
const path = require('path');

const COURSES = [
  { id:'c1',  name:'Lions Municipal (Muny)',       city:'Austin',     region:'Austin',            fee:35, photo:'assets/courses/c1.jpg',  tags:['Municipal','Historic'], blurb:"Austin's first public course (1924) and a Texas historic landmark — walkable, beloved, right in West Austin.", holes:18 },
  { id:'c2',  name:'Morris Williams Golf Course',  city:'Austin',     region:'Austin',            fee:38, photo:null,                     tags:['Municipal'],            blurb:"Locals' favorite muni with a unique routing and stunning downtown Austin skyline views.", holes:18 },
  { id:'c3',  name:'Roy Kizer Golf Course',        city:'Austin',     region:'Austin',            fee:42, photo:null,                     tags:['Links-style'],          blurb:"Austin's premier links-style muni — open, breezy, and a great walk in South Austin.", holes:18 },
  { id:'c4',  name:'Jimmy Clay Golf Course',       city:'Austin',     region:'Austin',            fee:34, photo:null,                     tags:['Municipal'],            blurb:'Shares a property with Roy Kizer — pair them for a 36-hole South Austin day.', holes:18 },
  { id:'c5',  name:'Riverside Golf Course',        city:'Austin',     region:'Austin',            fee:30, photo:null,                     tags:['Municipal','Historic'], blurb:'East-of-downtown muni where Texas legends Ben Crenshaw and Tom Kite first learned the game.', holes:18 },
  { id:'c6',  name:'Hancock Golf Course',          city:'Austin',     region:'Austin',            fee:18, photo:'assets/courses/c6.jpg', tags:['9-hole','Historic'],    blurb:'The oldest course in Texas (1899) — a quirky, walkable nine-holer in central Austin.', holes:9 },
  { id:'c7',  name:'Brackenridge Park Golf Course',city:'San Antonio',region:'San Antonio',       fee:50, photo:'assets/courses/c7.jpg',  tags:['Municipal','Historic'], blurb:'Historic tree-lined city-park course near downtown — old-school charm at a fair price.', holes:18 },
  { id:'c8',  name:'Cedar Creek Golf Course',      city:'San Antonio',region:'San Antonio',       fee:48, photo:null,                     tags:['Scenic'],               blurb:'Hilly, scenic Northwest San Antonio muni on the Alamo City Golf Trail.', holes:18 },
  { id:'c9',  name:'Olmos Basin Golf Course',      city:'San Antonio',region:'San Antonio',       fee:40, photo:null,                     tags:['Municipal'],            blurb:'Oak-lined municipal layout just minutes from downtown San Antonio.', holes:18 },
  { id:'c10', name:'Tenison Highlands',            city:'Dallas',     region:'Dallas–Fort Worth', fee:45, photo:null,                     tags:['Championship'],         blurb:'Redesigned 7,100-yard Highlands course — 36 holes, ten minutes from downtown Dallas.', holes:18 },
  { id:'c11', name:'Stevens Park Golf Course',     city:'Dallas',     region:'Dallas–Fort Worth', fee:40, photo:null,                     tags:['Historic'],             blurb:'1924 Kessler Park gem with downtown Dallas views — a true muni bargain.', holes:18 },
  { id:'c12', name:'Luna Vista Golf Course',       city:'Dallas',     region:'Dallas–Fort Worth', fee:32, photo:null,                     tags:['Municipal'],            blurb:'Honest, affordable Dallas muni (formerly L.B. Houston) along the Elm Fork.', holes:18 },
  { id:'c13', name:'Pecan Valley Golf Course',     city:'Fort Worth', region:'Dallas–Fort Worth', fee:35, photo:null,                     tags:['River'],                blurb:'Two 18s split by the Trinity River — the River course is among the best munis in Texas.', holes:36 },
  { id:'c14', name:'Rockwood Park Golf Course',    city:'Fort Worth', region:'Dallas–Fort Worth', fee:33, photo:null,                     tags:['Historic'],             blurb:'A John Bredemus 1938 design, revitalized by the City of Fort Worth — classic and walkable.', holes:18 },
  { id:'c15', name:'Meadowbrook Golf Course',      city:'Fort Worth', region:'Dallas–Fort Worth', fee:28, photo:null,                     tags:['Municipal'],            blurb:'East-central Fort Worth muni that plays fair for every skill level.', holes:18 },
  { id:'c16', name:'Memorial Park Golf Course',    city:'Houston',    region:'Houston',           fee:40, photo:'assets/courses/c16.jpg', tags:['PGA Tour host','Historic'], blurb:'Widely considered the best muni in Texas — a 1936 classic that now hosts the PGA Tour.', holes:18 },
  { id:'c17', name:'Gus Wortham Park Golf Course', city:'Houston',    region:'Houston',           fee:32, photo:null,                     tags:['Historic'],             blurb:'Restored historic muni just east of downtown Houston — scenic and affordable.', holes:18 },
  { id:'c18', name:'Hermann Park Golf Course',     city:'Houston',    region:'Houston',           fee:26, photo:'assets/courses/c18.jpg', tags:['Municipal','Central'],  blurb:'Historic, central Houston muni — easy to reach and easy on the wallet.', holes:18 },
  { id:'c19', name:'Sharpstown Golf Course',       city:'Houston',    region:'Houston',           fee:24, photo:null,                     tags:['Municipal'],            blurb:'Well-kept, lower-priced Houston muni — a reliable everyday track.', holes:18 },
];

const STRIPE_LINK = 'https://buy.stripe.com/5kQ28r7vmbGP0SW11p2Ji00';
const BASE_URL = 'https://trackpassgolf.com';

function slug(c) {
  return (c.name + '-' + c.city)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function roundsToBreakEven(fee) {
  return Math.ceil(199 / fee);
}

function generatePage(c) {
  const sl = slug(c);
  const canonicalUrl = `${BASE_URL}/courses/${sl}.html`;
  const imgUrl = c.photo ? `${BASE_URL}/${c.photo}` : `${BASE_URL}/assets/img/img_d233aed06c11.jpg`;
  const holeText = c.holes === 9 ? '9-hole' : c.holes === 36 ? '36-hole' : '18-hole';
  const breakEven = roundsToBreakEven(c.fee);
  const tagsStr = c.tags.join(', ');
  const nearbyCity = c.region;

  // Keyword-rich title variations
  const titlePrimary = `${c.name} Golf Pass — Unlimited Rounds | TrackPass`;
  const metaDesc = `Play ${c.name} in ${c.city}, TX with TrackPass — $199/year for unlimited rounds. Green fees up to $50/round covered. Break even in ${breakEven} visits. Join the founding list.`;

  // FAQ content tailored per course
  const faqs = [
    {
      q: `How much does it cost to play ${c.name}?`,
      a: `The standard green fee at ${c.name} is around $${c.fee}/round. With a TrackPass ($199/year), your green fee is covered up to $50/round — so you break even in just ${breakEven} visits. Every round after that is free.`
    },
    {
      q: `Is there a membership or season pass for ${c.name}?`,
      a: `${c.name} is a municipal course — the city may offer resident discount cards, but these are often limited to local residents and don't cover other courses. TrackPass covers ${c.name} AND 18 other Texas munis for one flat $199/year fee.`
    },
    {
      q: `What is TrackPass?`,
      a: `TrackPass is a $199/year Texas golf pass. Partner courses play free (no limit). Any other Texas public course: 1 reimbursement per month, up to $50, each course covered once. One flat $199/year.`
    },
    {
      q: `Is ${c.name} a good golf course?`,
      a: `${c.blurb} It's one of 19 TrackPass partner courses across ${nearbyCity} and Texas.`
    }
  ];

  const faqSchema = faqs.map(f => `{
      "@type": "Question",
      "name": ${JSON.stringify(f.q)},
      "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(f.a)} }
    }`).join(',\n    ');

  const faqHtml = faqs.map(f => `
        <div class="border-b border-surface-variant pb-6">
          <h3 class="font-headline-sm text-headline-sm text-on-surface mb-3">${f.q}</h3>
          <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">${f.a}</p>
        </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="theme-color" content="#16412b"/>
<title>${titlePrimary}</title>
<meta name="description" content="${metaDesc}"/>
<link rel="canonical" href="${canonicalUrl}"/>

<!-- Open Graph -->
<meta property="og:type" content="website"/>
<meta property="og:url" content="${canonicalUrl}"/>
<meta property="og:title" content="${c.name} — Unlimited Rounds with TrackPass | $199/year"/>
<meta property="og:description" content="${metaDesc}"/>
<meta property="og:image" content="${imgUrl}"/>
<meta property="og:site_name" content="TrackPass"/>

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${c.name} Golf Pass — $199/year | TrackPass"/>
<meta name="twitter:description" content="${metaDesc}"/>
<meta name="twitter:image" content="${imgUrl}"/>

<!-- JSON-LD -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "${canonicalUrl}",
      "url": "${canonicalUrl}",
      "name": "${titlePrimary}",
      "description": "${metaDesc}",
      "isPartOf": { "@id": "${BASE_URL}/#website" }
    },
    {
      "@type": "GolfCourse",
      "name": "${c.name}",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "${c.city}",
        "addressRegion": "TX",
        "addressCountry": "US"
      },
      "numberOfHoles": ${c.holes},
      "description": "${c.blurb}"
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
    ${faqSchema}
      ]
    }
  ]
}
</script>

<!-- Styles (same Tailwind CDN as main site) -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#16412b',
          'deep-forest': '#103223',
          'on-primary': '#ffffff',
          surface: '#f8faf7',
          'on-surface': '#1a2e22',
          'on-surface-variant': '#4a6355',
          'surface-variant': '#dde9e0',
        },
        fontFamily: {
          sans: ['"Inter"', 'system-ui', 'sans-serif'],
          display: ['"Playfair Display"', 'Georgia', 'serif'],
        }
      }
    }
  }
</script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet"/>
</head>

<body class="bg-surface text-on-surface font-sans antialiased">

<!-- Nav -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm">
  <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
    <a href="../index.html" class="text-white font-display font-bold text-xl tracking-tight">TrackPass</a>
    <div class="flex items-center gap-4">
      <a href="../courses.html" class="text-white/80 hover:text-white text-sm font-medium transition-colors">Courses</a>
      <a href="../plans.html" class="text-white/80 hover:text-white text-sm font-medium transition-colors">Pricing</a>
      <a href="${STRIPE_LINK}" class="bg-white text-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-colors">Join — $199</a>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="relative pt-16 min-h-[420px] flex items-end bg-primary overflow-hidden">
  ${c.photo ? `<div class="absolute inset-0 bg-cover bg-center opacity-30" style="background-image:url('../${c.photo}')"></div>` : ''}
  <div class="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent"></div>
  <div class="relative z-10 max-w-4xl mx-auto px-4 pb-16 pt-24">
    <div class="flex flex-wrap gap-2 mb-4">
      ${c.tags.map(t => `<span class="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">${t}</span>`).join('')}
    </div>
    <h1 class="font-display font-bold text-4xl md:text-6xl text-white mb-4 leading-tight">${c.name}</h1>
    <p class="text-white/80 text-lg md:text-xl mb-2">${c.city}, Texas &nbsp;·&nbsp; ${holeText}</p>
    <p class="text-white/70 text-base max-w-xl">${c.blurb}</p>
  </div>
</section>

<!-- Breadcrumb -->
<div class="bg-surface-variant/50 border-b border-surface-variant">
  <div class="max-w-4xl mx-auto px-4 py-3 text-sm text-on-surface-variant">
    <a href="../index.html" class="hover:text-primary transition-colors">TrackPass</a>
    <span class="mx-2">›</span>
    <a href="../courses.html" class="hover:text-primary transition-colors">Courses</a>
    <span class="mx-2">›</span>
    <span class="text-on-surface">${c.name}</span>
  </div>
</div>

<!-- Main content -->
<main class="max-w-4xl mx-auto px-4 py-16">

  <!-- Stats row -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
    <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-surface-variant">
      <div class="text-3xl font-display font-bold text-primary">$${c.fee}</div>
      <div class="text-xs text-on-surface-variant mt-1 font-medium uppercase tracking-wide">Green Fee</div>
    </div>
    <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-surface-variant">
      <div class="text-3xl font-display font-bold text-primary">${c.holes}</div>
      <div class="text-xs text-on-surface-variant mt-1 font-medium uppercase tracking-wide">Holes</div>
    </div>
    <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-surface-variant">
      <div class="text-3xl font-display font-bold text-primary">${breakEven}</div>
      <div class="text-xs text-on-surface-variant mt-1 font-medium uppercase tracking-wide">Rounds to break even</div>
    </div>
    <div class="bg-white rounded-2xl p-5 text-center shadow-sm border border-surface-variant">
      <div class="text-3xl font-display font-bold text-primary">19</div>
      <div class="text-xs text-on-surface-variant mt-1 font-medium uppercase tracking-wide">TX courses included</div>
    </div>
  </div>

  <!-- TrackPass pitch -->
  <div class="bg-primary rounded-3xl p-8 md:p-12 text-white mb-16">
    <h2 class="font-display font-bold text-3xl md:text-4xl mb-4">Play ${c.name} for free with TrackPass</h2>
    <p class="text-white/80 text-lg mb-6 leading-relaxed">
      TrackPass covers your green fee at ${c.name} — and 18 other Texas courses — for one flat $199/year.
      At $${c.fee}/round, you break even after just <strong class="text-white">${breakEven} rounds</strong>.
      Every visit after that is on us.
    </p>
    <div class="flex flex-col sm:flex-row gap-4">
      <a href="${STRIPE_LINK}" class="bg-white text-primary px-8 py-4 rounded-full font-bold text-lg text-center hover:bg-white/90 transition-colors">
        Join now — $199/year →
      </a>
      <a href="../plans.html" class="bg-transparent border border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg text-center hover:bg-white/10 transition-colors">
        See how it works
      </a>
    </div>
  </div>

  <!-- How it works for this course -->
  <div class="mb-16">
    <h2 class="font-display font-bold text-3xl text-on-surface mb-8">How TrackPass works at ${c.name}</h2>
    <div class="space-y-6">
      <div class="flex gap-4">
        <div class="flex-none w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
        <div>
          <h3 class="font-semibold text-on-surface mb-1">Join TrackPass ($199/year)</h3>
          <p class="text-on-surface-variant">One flat fee covers the whole year. No monthly charges, no per-round fees, no blackout dates.</p>
        </div>
      </div>
      <div class="flex gap-4">
        <div class="flex-none w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
        <div>
          <h3 class="font-semibold text-on-surface mb-1">Book your round at ${c.name}</h3>
          <p class="text-on-surface-variant">Call or book online at ${c.name} like you normally would. Pay the green fee at the pro shop.</p>
        </div>
      </div>
      <div class="flex gap-4">
        <div class="flex-none w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
        <div>
          <h3 class="font-semibold text-on-surface mb-1">Submit your receipt — get reimbursed</h3>
          <p class="text-on-surface-variant">Upload your receipt through the TrackPass app. We cover the green fee up to $50/round. Weekday and off-peak rates apply; full terms published before launch.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Other courses in region -->
  <div class="mb-16">
    <h2 class="font-display font-bold text-2xl text-on-surface mb-2">Also covered in ${c.region}</h2>
    <p class="text-on-surface-variant mb-6">Your TrackPass covers every course in the network — not just ${c.name}.</p>
    <a href="../courses.html" class="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
      View all 19 TrackPass courses →
    </a>
  </div>

  <!-- FAQ -->
  <div class="mb-16">
    <h2 class="font-display font-bold text-3xl text-on-surface mb-8">Frequently asked questions</h2>
    <div class="space-y-6">${faqHtml}
    </div>
  </div>

  <!-- Final CTA -->
  <div class="text-center bg-surface-variant rounded-3xl p-10">
    <h2 class="font-display font-bold text-3xl text-on-surface mb-3">Ready to play ${c.name} for free?</h2>
    <p class="text-on-surface-variant mb-8 text-lg">Join as a founding member — $199/year, locked in for life at this rate.</p>
    <a href="${STRIPE_LINK}" class="inline-block bg-primary text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-deep-forest transition-colors">
      Join TrackPass — $199/year
    </a>
  </div>

</main>

<!-- Footer -->
<footer class="bg-primary text-white/60 py-10 mt-16">
  <div class="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-4 text-sm">
    <div>
      <span class="text-white font-display font-bold text-lg">TrackPass</span>
      <p class="mt-1">$199/year · Any Texas course · No limit</p>
    </div>
    <div class="flex gap-6">
      <a href="../courses.html" class="hover:text-white transition-colors">All Courses</a>
      <a href="../plans.html" class="hover:text-white transition-colors">Pricing</a>
      <a href="../index.html" class="hover:text-white transition-colors">Home</a>
    </div>
  </div>
</footer>

<!-- PostHog analytics -->
<script src="../assets/analytics.js" defer></script>
</body>
</html>`;
}

// Generate all pages
const outDir = path.join(__dirname, 'courses');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sitemapEntries = [];

COURSES.forEach(c => {
  const sl = slug(c);
  const html = generatePage(c);
  const outPath = path.join(outDir, `${sl}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✓ ${outPath}`);
  sitemapEntries.push({ url: `${BASE_URL}/courses/${sl}.html`, lastmod: new Date().toISOString().split('T')[0] });
});

// Update sitemap
const sitemapPath = path.join(__dirname, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapPath, 'utf8');
const courseUrls = sitemapEntries.map(e => `
  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

sitemap = sitemap.replace('</urlset>', `${courseUrls}\n</urlset>`);
fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log('\n✓ sitemap.xml updated');
console.log(`\n${COURSES.length} course pages generated in /courses/`);

// Print slugs for reference
console.log('\nSlug → filename mapping:');
COURSES.forEach(c => console.log(`  ${c.id}: courses/${slug(c)}.html`));
