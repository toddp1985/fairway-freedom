#!/usr/bin/env python3
"""
TrackPass Instagram Auto-Poster (Playwright browser fallback)
Use when instagrapi is blocked by IP. Posts via real Chrome browser.

Usage:
  python3 scripts/ig-post-browser.py             # post today's course
  python3 scripts/ig-post-browser.py --dry-run   # preview only
"""

import sys, os, json, re, math, datetime, tempfile, urllib.request, pathlib, time

SCRIPT_DIR = pathlib.Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
COURSES_JS  = PROJECT_DIR / 'assets' / 'courses-data.js'
SESSION_DIR = PROJECT_DIR / '.pw-session'

IG_USERNAME = 'trackpassgolf'
IG_PASSWORD = os.environ.get('IG_PASSWORD', '')
DRY_RUN     = '--dry-run' in sys.argv

def load_courses():
    txt = COURSES_JS.read_text()
    m = re.search(r'window\.TRACKPASS_COURSES\s*=\s*(\[[\s\S]+?\]);', txt)
    return json.loads(m.group(1))

def pick_course(courses):
    day_num = datetime.date.today().timetuple().tm_yday
    return courses[day_num % len(courses)], day_num

def make_caption(c, day_num):
    name = c['name']
    city = c['city']
    fee  = c.get('fee', 40)
    is_partner = c.get('partner', False)
    tier_str = '2 free rounds/yr (partner course)' if is_partner else '1 free round/yr'
    breakeven = math.ceil(199 / fee)

    templates = [
        f"""{name} — {city}, TX.

Green fee without TrackPass: ~${fee}/round.
With TrackPass ($199/yr): {tier_str}.

{breakeven} rounds and you break even. Every round after that costs you nothing.

95 public Texas courses. One flat pass. No blackout dates.

Link in bio → trackpassgolf.com""",

        f"""Spotlight: {name} in {city}.

$199/yr gets you {tier_str} here — and at 94 other Texas public courses.

Green fees average ${fee}/round. TrackPass pays for itself fast.

trackpassgolf.com""",

        f"""{name}, {city} TX — one of 95 courses on the TrackPass network.

You pay ${fee} here without a pass. With TrackPass you don't.

$199. One year. Unlimited Texas golf (1-2 free rounds per course).

Link in bio.""",
    ]
    return templates[day_num % 3]

def get_hashtags(c):
    city_tag = c['city'].replace(' ', '').replace('-', '')
    return f"\n\n#TexasGolf #{city_tag}Golf #PublicGolf #TrackPass #GolfTexas #MunicipalGolf"

def download_photo(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
    with urllib.request.urlopen(req, timeout=15) as r:
        tmp.write(r.read())
    tmp.close()
    return tmp.name

def main():
    courses = load_courses()
    course, day_num = pick_course(courses)

    caption = make_caption(course, day_num) + get_hashtags(course)

    print(f"Course: {course['name']} ({course['city']})")
    print(f"Caption preview:\n{caption}\n")

    if DRY_RUN:
        print("DRY RUN — no post made.")
        return

    if not IG_PASSWORD:
        print("ERROR: IG_PASSWORD env var not set.")
        sys.exit(1)

    # Download photo
    photo_url = course.get('photo') or course.get('image', '')
    if not photo_url:
        print("No photo URL for this course — using logo fallback.")
        photo_path = str(PROJECT_DIR / 'assets' / 'logo.jpg')
    else:
        print(f"Fetching photo: {photo_url}")
        photo_path = download_photo(photo_url)
        print(f"Photo saved: {photo_path}")

    # Launch Playwright
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        SESSION_DIR.mkdir(exist_ok=True)
        browser = p.chromium.launch_persistent_context(
            str(SESSION_DIR),
            headless=True,
            viewport={'width': 1280, 'height': 900},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        )
        page = browser.new_page()

        # Check if already logged in
        page.goto('https://www.instagram.com/', timeout=30000)
        time.sleep(3)

        if 'login' in page.url or page.query_selector('input[name="email"]') or page.query_selector('input[name="username"]'):
            print("Not logged in — authenticating...")
            page.goto('https://www.instagram.com/accounts/login/', timeout=30000)
            time.sleep(4)
            # Desktop IG uses name="email" and name="pass" (not username/password)
            page.locator('input[name="email"]').fill(IG_USERNAME)
            time.sleep(1)
            page.locator('input[name="pass"]').fill(IG_PASSWORD)
            time.sleep(1)
            page.locator('input[type="submit"]').click()
            time.sleep(8)

            # Handle "Save login info?" dialog
            try:
                save_btn = page.query_selector('button:has-text("Save Info")')
                if save_btn:
                    save_btn.click()
                    time.sleep(2)
            except:
                pass

            # Handle "Turn on notifications?" dialog
            try:
                not_now = page.query_selector('button:has-text("Not Now")')
                if not_now:
                    not_now.click()
                    time.sleep(2)
            except:
                pass

        print(f"Logged in — current URL: {page.url}")

        # Navigate to create post (mobile web version)
        page.goto('https://www.instagram.com/', timeout=30000)
        time.sleep(3)

        # Click the + / New Post button
        plus_btn = page.query_selector('svg[aria-label="New post"]')
        if not plus_btn:
            # Try the bottom nav + button
            plus_btn = page.query_selector('[aria-label="New post"]')
        if plus_btn:
            plus_btn.click()
            time.sleep(2)
        else:
            print("Could not find New Post button — trying direct URL")
            # Instagram doesn't have a direct /create URL on web reliably

        # Upload photo via file chooser
        with page.expect_file_chooser() as fc_info:
            select_btn = page.query_selector('button:has-text("Select from computer")')
            if not select_btn:
                select_btn = page.query_selector('[role="button"]:has-text("Select from")')
            if select_btn:
                select_btn.click()
            else:
                print("Could not find file upload button — Instagram may have changed UI")
                browser.close()
                sys.exit(1)
        fc = fc_info.value
        fc.set_files(photo_path)
        time.sleep(3)

        # Click Next
        for i in range(3):  # up to 3 Next clicks (crop → filter → caption)
            next_btn = page.query_selector('button:has-text("Next")')
            if next_btn:
                next_btn.click()
                time.sleep(2)

        # Add caption
        caption_box = page.query_selector('[aria-label="Write a caption..."]')
        if not caption_box:
            caption_box = page.query_selector('textarea[placeholder*="caption"]')
        if caption_box:
            caption_box.click()
            page.keyboard.type(caption)
            time.sleep(1)

        # Share
        share_btn = page.query_selector('button:has-text("Share")')
        if share_btn:
            share_btn.click()
            time.sleep(5)
            print(f"Posted: {course['name']}")
        else:
            print("Could not find Share button — post may not have been submitted")
            sys.exit(1)

        browser.close()

    # Cleanup temp photo
    if photo_path != str(PROJECT_DIR / 'assets' / 'logo.jpg'):
        os.unlink(photo_path)

if __name__ == '__main__':
    main()
