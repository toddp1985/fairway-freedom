# TrackPass Auto-Post Cron Setup

## What this does
Posts a daily course spotlight to Instagram and X/Twitter automatically.
Zero manual effort once configured.

## Quick setup (do these once)

### Instagram (10 minutes)
1. Open Instagram app → Settings → Account → Switch to Professional Account → Creator
2. Go to facebook.com/pages/create → create page "TrackPass" (use any FB account)
3. IG app → Settings → Account → Linked Accounts → Facebook → connect to TrackPass page
4. Go to developers.facebook.com → My Apps → Create App → Business type
5. Add product: Instagram Graph API → set up permissions: instagram_content_publish, instagram_basic, pages_show_list
6. Add Redirect URI: https://trackpassgolf.com/
7. Run: `node ~/Projects/trackpass/scripts/get-ig-token.js`
8. Follow the steps to get your long-lived token (valid 60 days)
9. Add to ~/.zprofile:
   ```
   export IG_ACCESS_TOKEN="your_token_here"
   export IG_USER_ID="your_ig_user_id"
   ```

### X/Twitter (5 minutes)
1. Go to developer.twitter.com → sign in → Projects & Apps → New Project
2. Create app → Permissions: Read and Write
3. Keys and Tokens → copy API Key, API Secret, Access Token, Access Token Secret
4. Install twurl: `gem install twurl`
5. Authorize: `twurl authorize --consumer-key $X_API_KEY --consumer-secret $X_API_SECRET`
6. Add to ~/.zprofile:
   ```
   export X_API_KEY="..."
   export X_API_SECRET="..."
   export X_ACCESS_TOKEN="..."
   export X_ACCESS_SECRET="..."
   ```

## Test the poster
```bash
source ~/.zprofile
node ~/Projects/trackpass/scripts/auto-post.js
```

## Schedule it (run daily at 9am CT automatically)
Once credentials are set, Hermes cron handles the rest.
Tell Hermes: "Set up a daily cron at 9am CT to run node ~/Projects/trackpass/scripts/auto-post.js"

## Token refresh (Instagram tokens expire every 60 days)
Instagram long-lived tokens need refresh every 60 days:
```bash
curl -i -X GET "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=$IG_ACCESS_TOKEN"
```
Set a calendar reminder or let Hermes handle it via cron.
