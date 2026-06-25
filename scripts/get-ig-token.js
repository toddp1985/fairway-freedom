#!/usr/bin/env node
/**
 * One-time Instagram Graph API token setup
 * Run AFTER: 
 *   1. Converting @trackpassgolf to a Creator/Business account in the IG app
 *   2. Creating a Facebook Page and connecting IG to it
 *   3. Creating a Meta App at developers.facebook.com with Instagram Graph API permissions
 * 
 * Steps:
 *   1. Set your App ID and App Secret below (from developers.facebook.com)
 *   2. Run: node scripts/get-ig-token.js
 *   3. Follow the URL it prints to authorize
 *   4. It will print your long-lived token and IG User ID
 *   5. Save them: echo 'export IG_ACCESS_TOKEN=...' >> ~/.zprofile
 */

const APP_ID = process.env.META_APP_ID || 'YOUR_APP_ID';
const APP_SECRET = process.env.META_APP_SECRET || 'YOUR_APP_SECRET';
const REDIRECT_URI = 'https://trackpassgolf.com/';

if (APP_ID === 'YOUR_APP_ID') {
  console.log('Setup instructions:');
  console.log('1. Go to developers.facebook.com → Create App → Business type');
  console.log('2. Add product: Instagram Graph API');
  console.log('3. Copy your App ID and App Secret');
  console.log('4. Add Redirect URI in app settings: https://trackpassgolf.com/');
  console.log('5. Run: META_APP_ID=xxx META_APP_SECRET=yyy node scripts/get-ig-token.js');
  console.log('\nAuth URL template:');
  console.log(`https://www.facebook.com/dialog/oauth?client_id=APP_ID&display=page&extras={"setup":{"channel":"IG_API_ONBOARDING"}}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement`);
  process.exit(0);
}

// Exchange short-lived token for long-lived token (60 days)
async function exchangeToken(shortToken) {
  const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.access_token;
}

// Get IG User ID from Page access token
async function getIGUserId(pageToken, pageId) {
  const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
  const data = await res.json();
  return data.instagram_business_account?.id;
}

console.log('Paste your short-lived user access token (from auth URL above):');
process.stdin.once('data', async (buf) => {
  const shortToken = buf.toString().trim();
  try {
    const longToken = await exchangeToken(shortToken);
    console.log('\n✅ Long-lived token (valid 60 days):');
    console.log(`export IG_ACCESS_TOKEN="${longToken}"`);
    console.log('\nNow get your IG User ID:');
    const res = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`);
    const pages = await res.json();
    if (pages.data) {
      for (const page of pages.data) {
        const igId = await getIGUserId(page.access_token, page.id);
        if (igId) {
          console.log(`export IG_USER_ID="${igId}"  # connected to page: ${page.name}`);
        }
      }
    }
    console.log('\nAdd both exports to ~/.zprofile then run: source ~/.zprofile');
    console.log('Then test: node scripts/auto-post.js');
  } catch (e) {
    console.error('Error:', e.message);
  }
});
