# Instagram Graph API Setup (one-time, ~10 min)

## Prerequisites
- @trackpassgolf must be a Creator or Business account (not Personal)
- Need a Facebook Page connected to the IG account

---

## Step 1 — Convert @trackpassgolf to Creator account
**On your phone in the Instagram app:**
Settings → Account → Switch Account Type → Creator Account

---

## Step 2 — Create a Facebook Page
Go to: https://www.facebook.com/pages/create
- Page name: TrackPass Golf
- Category: Sports & Recreation
- Skip optional steps, click Create Page

---

## Step 3 — Connect @trackpassgolf to the Facebook Page
**On your phone in the Instagram app:**
Settings → Account → Linked Accounts → Facebook → select "TrackPass Golf" page

---

## Step 4 — Create Meta Developer App
Go to: https://developers.facebook.com/apps/create/
1. Select **Business** type
2. App name: `TrackPass`
3. App contact email: `hello@trackpassgolf.com`
4. Click **Create App**
5. On the dashboard, click **+ Add Product** → find **Instagram Graph API** → click **Set Up**
6. Go to **App Settings → Basic**
   - Copy **App ID** (numbers)
   - Click **Show** next to App Secret → copy it
7. Scroll down to **Valid OAuth Redirect URIs** and add:
   `https://trackpass-waitlist.todd-676.workers.dev/oauth/callback`
8. Click **Save Changes**

---

## Step 5 — Save secrets to Worker
Run these two commands, pasting when prompted:
```bash
cd ~/Projects/trackpass-waitlist-worker
wrangler secret put META_APP_ID
wrangler secret put META_APP_SECRET
```

---

## Step 6 — Open the auth URL
Replace YOUR_APP_ID with the actual App ID from Step 4, then open in your browser:

```
https://www.facebook.com/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=https://trackpass-waitlist.todd-676.workers.dev/oauth/callback&response_type=code&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement
```

Click **Continue as TrackPass Golf** → **Allow**

You'll be redirected to a success page at trackpass-waitlist.todd-676.workers.dev that shows:
- ✅ Instagram Connected!
- Your IG User ID
- The long-lived token (valid 60 days, auto-refreshable)

---

## Step 7 — Save tokens to ~/.zprofile
The success page will show the exact export commands. Copy them, then run:
```bash
echo 'export IG_ACCESS_TOKEN="EAA..."' >> ~/.zprofile
echo 'export IG_USER_ID="17..."' >> ~/.zprofile
source ~/.zprofile
```

---

## Step 8 — Test
```bash
cd ~/Projects/trackpass
node scripts/auto-post.js
```

After that, posting runs daily automatically via the Hermes cron.
