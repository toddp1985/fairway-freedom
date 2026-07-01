#!/usr/bin/env python3
"""
TrackPass Instagram Auto-Poster (instagrapi)
Picks the course of the day, downloads photo, posts with caption.
Run manually first to complete any login challenge, then cron handles it.

Usage:
  python3 scripts/ig-post.py             # post today's course
  python3 scripts/ig-post.py --dry-run   # preview caption only, no post
  python3 scripts/ig-post.py --login     # force re-login / clear session
"""

import sys, os, json, re, math, datetime, tempfile, urllib.request, pathlib

SCRIPT_DIR = pathlib.Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
SESSION_FILE = PROJECT_DIR / '.ig-session.json'
COURSES_JS = PROJECT_DIR / 'assets' / 'courses-data.js'

IG_USERNAME = 'trackpassgolf'
IG_PASSWORD = os.environ.get('IG_PASSWORD', '')

DRY_RUN = '--dry-run' in sys.argv
FORCE_LOGIN = '--login' in sys.argv

# Load courses
def load_courses():
    txt = COURSES_JS.read_text()
    m = re.search(r'window\.TRACKPASS_COURSES\s*=\s*(\[[\s\S]+?\]);', txt)
    return json.loads(m.group(1))

# Pick today's course deterministically (by day of year, rotate through all 95)
def pick_course(courses):
    today = datetime.date.today()
    day_num = today.timetuple().tm_yday
    # Only post Mon/Wed/Fri so we skip ~half the year-days; use day_num directly
    return courses[day_num % len(courses)]

# Generate caption from templates
def make_caption(c, day_num):
    name = c['name']
    city = c['city']
    fee = c.get('fee', 40)
    blurb = c.get('blurb', '')
    is_partner = c.get('partner', False)
    tier_str = '2 free rounds/yr (partner course)' if is_partner else '1 free round/yr'
    breakeven = math.ceil(199 / fee)

    templates = [
        f"""{name} — {city}, TX.

Green fee without TrackPass: ~${fee}/round.

With TrackPass ($199/yr): {tier_str}.

{breakeven} rounds and you break even. Every round after that costs you nothing.

95 public Texas courses. One flat pass. No blackout dates.

Link in bio → trackpassgolf.com

#TexasGolf #{city.replace(' ','')}Golf #PublicGolf #TrackPass #GolfTexas #MunicipalGolf""",

        f"""Play {name} free.

{blurb or f"One of {city}'s best public courses."}

TrackPass members: {tier_str}.
Green fee otherwise: ~${fee}.

$199/yr. Every public course in Texas. Unlimited access.

trackpassgolf.com (link in bio)

#TrackPass #TexasGolf #GolfPass #{city.replace(' ','')} #PublicGolf #GolfLife""",

        f"""{city} golfers — {name} is in the TrackPass network.

${fee}/round normally.
With TrackPass ($199/yr): {tier_str}.

That's {breakeven} rounds to break even — then every round after is free.

95 Texas public courses. Join the waitlist at trackpassgolf.com

#GolfTexas #TrackPass #{city.replace(' ','')}Golf #PublicGolf #GolfPass #TexasGolf""",
    ]
    return templates[day_num % len(templates)]

# Download photo to temp file, return path
def get_photo(c):
    photo = c.get('photo', '')
    if not photo:
        return None
    if photo.startswith('http'):
        suffix = pathlib.Path(photo).suffix or '.jpg'
        tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
        try:
            req = urllib.request.Request(photo, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as r:
                tmp.write(r.read())
            tmp.flush()
            return tmp.name
        except Exception as e:
            print(f'  photo download failed: {e}')
            tmp.close()
            os.unlink(tmp.name)
            return None
    else:
        # local path relative to project
        local = PROJECT_DIR / photo
        return str(local) if local.exists() else None

# Handle login challenge (email code)
def challenge_code_handler(username, choice):
    """Called by instagrapi when a verification code is needed."""
    print(f'\n  Instagram sent a verification code to your email (hello@trackpassgolf.com).')
    print(f'  Check todd@peoplesvp.com for the code.')
    code = input('  Enter the 6-digit code: ').strip()
    return code

def main():
    from instagrapi import Client
    from instagrapi.exceptions import LoginRequired, ChallengeRequired

    courses = load_courses()
    today = datetime.date.today()
    day_num = today.timetuple().tm_yday
    course = pick_course(courses)

    caption = make_caption(course, day_num)

    print(f'📍 Course: {course["name"]} ({course["city"]}, TX)')
    print(f'📅 Date: {today} (day {day_num})')
    print(f'\n📝 Caption:\n{caption}\n')

    if DRY_RUN:
        print('(dry-run — not posting)')
        return

    # Get photo
    print('📸 Fetching photo...')
    photo_path = get_photo(course)
    if not photo_path:
        print('⚠️  No photo available for this course. Skipping.')
        sys.exit(1)
    print(f'   Photo: {photo_path}')

    # Init client
    cl = Client()
    cl.challenge_code_handler = challenge_code_handler
    cl.delay_range = [2, 5]

    # Try session first
    session_loaded = False
    if not FORCE_LOGIN and SESSION_FILE.exists():
        try:
            session = json.loads(SESSION_FILE.read_text())
            cl.set_settings(session)
            cl.login(IG_USERNAME, IG_PASSWORD)
            session_loaded = True
            print('✅ Logged in via saved session')
        except Exception as e:
            print(f'  Session expired ({e}), re-logging...')
            session_loaded = False

    if not session_loaded:
        if not IG_PASSWORD:
            print('\n❌ IG_PASSWORD env var not set.')
            print('   Run: export IG_PASSWORD="your_password" && python3 scripts/ig-post.py')
            sys.exit(1)
        print(f'🔐 Logging in as {IG_USERNAME}...')
        try:
            cl.login(IG_USERNAME, IG_PASSWORD)
        except ChallengeRequired:
            print('  Challenge triggered — completing...')
            cl.challenge_resolve(cl.last_json)
        # Save session
        SESSION_FILE.write_text(json.dumps(cl.get_settings()))
        print('✅ Logged in, session saved')

    # Post
    print('🚀 Posting to Instagram...')
    try:
        media = cl.photo_upload(photo_path, caption=caption)
        print(f'✅ Posted! Media ID: {media.pk}')
        print(f'   https://www.instagram.com/p/{media.code}/')
        # Save fresh session after successful post
        SESSION_FILE.write_text(json.dumps(cl.get_settings()))
    except Exception as e:
        print(f'❌ Post failed: {e}')
        sys.exit(1)
    finally:
        # Clean up temp file
        if photo_path and photo_path.startswith('/tmp'):
            try: os.unlink(photo_path)
            except: pass

if __name__ == '__main__':
    main()
