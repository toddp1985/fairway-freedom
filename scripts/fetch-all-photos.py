#!/usr/bin/env python3
"""
Fetch GolfPass photo URLs for all TX courses missing photos.
Uses DuckDuckGo to find course IDs, then fetches S3 URLs directly via curl.
"""
import subprocess, re, json, time, urllib.parse, sys

AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

COURSES = [
    # SA / South TX
    ("sa-northern-hills", "Northern Hills Golf Club San Antonio Texas"),
    ("sa-riverside", "Riverside Golf Course San Antonio Texas"),
    ("nb-landa-park", "Landa Park Golf Course New Braunfels Texas"),
    ("wes-tierra-santa", "Tierra Santa Golf Club Weslaco Texas"),
    ("bro-brownsville", "Brownsville Municipal Golf Course Texas"),
    ("mcal-mcallen-muni", "McAllen Municipal Golf Course Texas"),
    ("lrd-casa-blanca", "Casa Blanca Golf Course Laredo Texas"),
    ("vic-victoria-muni", "Victoria Municipal Golf Course Texas"),
    ("cc-gabe-lozano", "Gabe Lozano Golf Center Corpus Christi Texas"),
    ("cc-oso-beach", "Oso Beach Municipal Golf Course Corpus Christi"),
    # Houston / Gulf Coast
    ("hou-melrose-park", "Melrose Park Golf Course Houston Texas"),
    ("bay-baytown", "Evergreen Point Golf Club Baytown Texas"),
    ("flk-friendswood", "Friendswood Golf Club Texas"),
    ("lkj-lake-jackson", "Lake Jackson Golf Course Texas"),
    ("moc-missouri-city", "Missouri City Golf Course Texas"),
    ("pas-muni", "Pasadena Municipal Golf Course Texas"),
    ("prl-pearland-golf", "Pearland Golf Club Country Place Texas"),
    ("sul-oyster-creek", "Oyster Creek Golf Course Sugar Land Texas"),
    ("cyp-longwood", "Longwood Golf Club Cypress Texas"),
    ("con-west-fork", "West Fork Golf Club Conroe Texas"),
    ("gal-galveston-island", "Galveston Island Golf Course Texas"),
    # DFW suburbs
    ("arl-chester-w-ditto", "Chester W Ditto Golf Course Arlington Texas"),
    ("gar-firewheel-lakes", "Firewheel Golf Park Lakes Course Garland Texas"),
    ("row-waterview", "Waterview Golf Club Rowlett Texas"),
    ("ced-cedar-hill", "Cedar Hill Golf Course Texas"),
    ("hst-hurst-hills", "Hurst Hills Golf Course Texas"),
    ("den-eagle-pointe", "Eagle Pointe Golf Club Denton Texas"),
    ("gp-tangle-ridge", "Tangle Ridge Golf Course Grand Prairie Texas"),
    ("rwk-rockwall", "Rockwall Golf Athletic Club Texas"),
    ("grv-grapevine-golf", "Grapevine Golf Course Texas"),
    ("wf-weeks-park", "Weeks Park Golf Course Wichita Falls Texas"),
    ("mw-mineral-wells", "Mineral Wells Golf Course Texas"),
    ("wfd-weatherford", "Weatherford Golf Club Texas"),
    ("grb-granbury", "Granbury Country Club Texas"),
    # Central TX / Austin area
    ("smk-springs-hill", "Springs Hill Golf Course San Marcos Texas"),
    ("geo-georgetown-muni", "Georgetown Golf Course Texas"),
    ("rr-old-settlers-park", "Old Settlers Park Golf Course Round Rock Texas"),
    ("cp-twin-creeks", "Twin Creeks Golf Club Cedar Park Texas"),
    ("kil-skylark-field", "Skylark Field Golf Course Killeen Texas"),
    ("tem-sammons", "Sammons Golf Course Temple Texas"),
    # West TX
    ("ep-ascarate", "Ascarate Municipal Golf Course El Paso Texas"),
    ("lub-shadow-hills", "Shadow Hills Golf Course Lubbock Texas"),
    ("abi-maxwell", "Maxwell Municipal Golf Course Abilene Texas"),
    ("abi-willow-creek", "Willow Creek Golf Center Abilene Texas"),
    ("ods-odessa", "Ratliff Ranch Golf Links Odessa Texas"),
    # East TX
    ("tyl-faulkner-park", "Faulkner Park Golf Course Tyler Texas"),
    ("bmt-tyrrell-park", "Tyrrell Park Golf Course Beaumont Texas"),
    ("luf-lufkin", "Lufkin Municipal Golf Course Texas"),
    ("lng-longview", "Alpine Golf Course Longview Texas"),
    ("nac-nacogdoches", "Woodland Hills Golf Course Nacogdoches Texas"),
    ("bcs-pebble-creek", "Pebble Creek Golf Course College Station Texas"),
    ("wac-cottonwood-creek", "Cottonwood Creek Golf Course Waco Texas"),
    ("ssp-sulphur-springs", "Sulphur Springs Golf Course Texas"),
    ("mar-marshall", "Marshall Municipal Golf Course Texas"),
    ("plt-palestine", "Palestine Country Club Texas"),
    ("hen-henderson", "Henderson Golf Course Texas"),
    # Misc
    ("stp-stephenville", "Stephenville Golf Course Texas"),
    ("pam-pampa", "Pampa Municipal Golf Course Texas"),
]

def curl(url, extra_args=None):
    cmd = ["curl", "-sL", url, "-A", AGENT, "--max-time", "10"]
    if extra_args:
        cmd.extend(extra_args)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout

def curl_head(url):
    r = subprocess.run(["curl", "-sI", url, "-A", AGENT, "--max-time", "5"], capture_output=True, text=True)
    m = re.search(r"HTTP/\S+\s+(\d+)", r.stdout)
    return int(m.group(1)) if m else 0

def find_photo(course_id, query):
    # Step 1: DuckDuckGo to find GolfPass course URL with numeric ID
    q = urllib.parse.quote(f'site:golfpass.com travel-advisor courses {query}')
    ddg_html = curl(f"https://html.duckduckgo.com/html/?q={q}")

    urls = re.findall(r'golfpass\.com/travel-advisor/courses/(\d+)-([^\s"&<?\\/]+)', ddg_html)
    if not urls:
        print(f"  MISS (no DDG result): {course_id}", flush=True)
        return None

    numeric_id, slug = urls[0]
    course_url = f"https://www.golfpass.com/travel-advisor/courses/{numeric_id}-{slug}/"

    # Step 2: Fetch course page, extract S3 URL
    html = curl(course_url)

    # Find CDN URL which contains encoded S3 URL
    cdn_matches = re.findall(r'url=https%3A%2F%2Fgolf-pass-brightspot\.s3\.amazonaws\.com%2F[^"&]+', html)
    if not cdn_matches:
        # Try og:image directly
        og = re.findall(r'og:image[^>]+content="([^"]+)"', html)
        if og and 's3.amazonaws.com' in og[0]:
            s3_url = og[0]
        else:
            print(f"  NO_S3: {course_id} ({course_url})", flush=True)
            return None
    else:
        s3_url = urllib.parse.unquote(cdn_matches[0].replace('url=', ''))

    # Step 3: Verify URL returns 200
    status = curl_head(s3_url)
    if status != 200:
        print(f"  DEAD ({status}): {course_id} -> {s3_url}", flush=True)
        return None

    print(f"  HIT: {course_id} -> {s3_url}", flush=True)
    return {"id": course_id, "photo_url": s3_url}

results = []
for i, (course_id, query) in enumerate(COURSES):
    result = find_photo(course_id, query)
    if result:
        results.append(result)
    time.sleep(0.4)

out_path = "/tmp/golfpass-photos.json"
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)

print(f"\nDone. Found {len(results)}/{len(COURSES)} photos.")
print(f"Results saved to {out_path}")
print(json.dumps(results, indent=2))
