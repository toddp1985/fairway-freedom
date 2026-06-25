#!/usr/bin/env node
/**
 * TrackPass Auto-Poster
 * Posts a daily course spotlight to Instagram (Graph API) and X (Twitter API v2).
 * 
 * Run: node scripts/auto-post.js
 * 
 * SETUP REQUIRED (one-time):
 * 1. Instagram: In the IG app → Settings → Account → Switch to Professional Account → Creator
 * 2. Create a Facebook Page at facebook.com/pages/create (use hello@trackpassgolf.com)
 * 3. Connect IG to FB Page: IG app → Settings → Account → Linked Accounts → Facebook
 * 4. Go to developers.facebook.com → Create App → Business → add Instagram Graph API
 * 5. Run the token exchange: node scripts/get-ig-token.js
 * 6. Save the long-lived token: export IG_ACCESS_TOKEN=... and IG_USER_ID=...
 * 7. For X: go to developer.twitter.com → get API keys → export X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load course data
const dataFile = path.join(__dirname, '../assets/courses-data.js');
const raw = fs.readFileSync(dataFile, 'utf8');
const match = raw.match(/window\.TRACKPASS_COURSES\s*=\s*(\[[\s\S]+\]);/);
const courses = JSON.parse(match[1]);

// Pick course of the day (deterministic by date so the same post isn't repeated)
const today = new Date();
const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
const course = courses[dayOfYear % courses.length];

// Generate caption
function generateCaption(c) {
  const tier = c.partner ? '⭐ Partner course — 2 free rounds/yr' : '1 free round/yr with TrackPass';
  const templates = [
    `${c.name} in ${c.city}, TX.\n\nGreen fee: ~$${c.fee}/round without TrackPass.\n\n${tier}.\n\nTrackPass: $199/yr flat. Play every public course in Texas.\n\nLink in bio → trackpassgolf.com\n\n#TexasGolf #${c.city.replace(/\s/,'')}Golf #MunicipalGolf #TrackPass #GolfTexas #PublicGolf`,
    `Play ${c.name} for free.\n\n${c.blurb || `One of ${c.city}'s best public courses.`}\n\nWith TrackPass ($199/yr): ${tier.toLowerCase()}.\n\nGreen fee without it: ~$${c.fee}.\n\n4 rounds and you break even. Play more after that for free.\n\nLink in bio.\n\n#TexasGolf #${c.city.replace(/\s/,'')} #GolfPass #TrackPass #PublicGolf #GolfTexas`,
    `${c.city}, TX golfers: ${c.name} is in the TrackPass network.\n\n${tier}.\n\nOne flat $199/yr pass. Every public course in Texas. No tiers. No blackout dates.\n\nCalculate your break-even: 4 rounds at ~$${c.fee} each = $${c.fee * 4}. Pass pays itself.\n\nLink in bio → trackpassgolf.com\n\n#TexasGolf #GolfPass #${c.city.replace(/\s/,'')}Golf #TrackPass #GolfLife #PublicGolf`,
  ];
  return templates[dayOfYear % templates.length];
}

const caption = generateCaption(course);
const photoUrl = course.photo && course.photo.startsWith('http') ? course.photo : null;

console.log(`📍 Course of the day: ${course.name} (${course.city}, TX)`);
console.log(`📸 Photo: ${photoUrl || '(no URL — using course name card)'}`);
console.log(`\n📝 Caption:\n${caption}\n`);

// --- Instagram Graph API ---
async function postToInstagram() {
  const token = process.env.IG_ACCESS_TOKEN;
  const userId = process.env.IG_USER_ID;
  
  if (!token || !userId) {
    console.log('⚠️  Instagram: IG_ACCESS_TOKEN or IG_USER_ID not set. Skipping.');
    console.log('   See SETUP REQUIRED at top of this file.');
    return false;
  }
  
  if (!photoUrl) {
    console.log('⚠️  Instagram: No photo URL for this course. Skipping until photo available.');
    return false;
  }

  try {
    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: photoUrl,
          caption: caption,
          access_token: token,
        }),
      }
    );
    const createData = await createRes.json();
    if (createData.error) { console.error('IG create error:', createData.error.message); return false; }
    
    // Step 2: Publish container
    const publishRes = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: createData.id, access_token: token }),
      }
    );
    const publishData = await publishRes.json();
    if (publishData.error) { console.error('IG publish error:', publishData.error.message); return false; }
    
    console.log(`✅ Instagram: Posted successfully (id: ${publishData.id})`);
    return true;
  } catch (e) {
    console.error('Instagram error:', e.message);
    return false;
  }
}

// --- X (Twitter) API v2 ---
async function postToX() {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;
  
  if (!apiKey || !accessToken) {
    console.log('⚠️  X/Twitter: credentials not set. Skipping.');
    console.log('   Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET');
    return false;
  }
  
  // X post is max 280 chars — use shortened version
  const xCaption = `${course.name} (${course.city}, TX) — ~$${course.fee}/round.\n\nWith TrackPass $199/yr: ${course.partner ? '2 free rounds/yr' : '1 free round/yr'}.\n\n95 TX public courses. One flat pass.\n\ntrackpassgolf.com\n\n#TexasGolf #GolfPass #PublicGolf`;
  
  try {
    // Use OAuth 1.0a signing (simplified — use oauth-1.0a package if available)
    const { execSync } = require('child_process');
    // Fallback: use curl with OAuth if twurl is installed
    const curlCheck = execSync('which twurl 2>/dev/null || echo ""').toString().trim();
    if (curlCheck) {
      execSync(`twurl /2/tweets -d '{"text":"${xCaption.replace(/'/g,"'\\''")}"}'`);
      console.log('✅ X: Posted via twurl');
      return true;
    }
    console.log('⚠️  X: twurl not installed. Run: gem install twurl && twurl authorize --consumer-key $X_API_KEY --consumer-secret $X_API_SECRET');
    return false;
  } catch (e) {
    console.error('X error:', e.message);
    return false;
  }
}

// --- Main ---
(async () => {
  const igResult = await postToInstagram();
  const xResult = await postToX();
  
  if (!igResult && !xResult) {
    console.log('\n💡 Both platforms skipped — credentials not configured.');
    console.log('   The post content above is ready to use manually.');
    process.exit(0);
  }
  
  console.log(`\nDone. IG: ${igResult ? '✅' : '⚠️'}  X: ${xResult ? '✅' : '⚠️'}`);
})();
