#!/bin/bash
# Fetch GolfPass photo URLs for all courses missing photos
# Uses DuckDuckGo to find course IDs, then fetches S3 URLs directly

AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
OUT="/tmp/golfpass-photos.json"
echo "[" > "$OUT"
FIRST=1

find_photo() {
  local course_id="$1"
  local query="$2"

  # Search DuckDuckGo for the GolfPass URL
  local encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")
  local ddg_url="https://html.duckduckgo.com/html/?q=site:golfpass.com+travel-advisor+courses+${encoded}"
  local course_url=$(curl -sL "$ddg_url" -A "$AGENT" --max-time 8 | grep -oP 'golfpass\.com/travel-advisor/courses/\d+-[^"&\s<]+' | head -1 | sed 's/?page=.*//')

  if [ -z "$course_url" ]; then
    echo "  MISS: $course_id"
    return
  fi

  local full_url="https://www.${course_url}/"
  # Fetch the course page and extract raw S3 URL
  local s3_url=$(curl -sL "$full_url" -A "$AGENT" --max-time 10 | grep -oP '(?<=url=https%3A%2F%2F)[^"&]+' | python3 -c "import sys,urllib.parse; lines=sys.stdin.read().strip().split(); print(urllib.parse.unquote('https://'+lines[0]) if lines else '')" 2>/dev/null)

  if [ -z "$s3_url" ] || [[ "$s3_url" != *"s3.amazonaws.com"* ]]; then
    echo "  NO_S3: $course_id ($full_url)"
    return
  fi

  # Verify 200
  local status=$(curl -sI "$s3_url" --max-time 5 | grep -oP 'HTTP/\S+ \K\d+' | head -1)
  if [ "$status" != "200" ]; then
    echo "  DEAD: $course_id $s3_url ($status)"
    return
  fi

  echo "  HIT: $course_id -> $s3_url"
  if [ "$FIRST" = "1" ]; then
    FIRST=0
  else
    echo "," >> "$OUT"
  fi
  echo "  {\"id\": \"$course_id\", \"photo_url\": \"$s3_url\"}" >> "$OUT"
  sleep 0.4
}

# SA / South TX
find_photo "sa-northern-hills" "Northern Hills Golf Club San Antonio"
find_photo "sa-riverside" "Riverside Golf Course San Antonio Texas"
find_photo "nb-landa-park" "Landa Park Golf Course New Braunfels"
find_photo "wes-tierra-santa" "Tierra Santa Golf Club Weslaco Texas"
find_photo "bro-brownsville" "Brownsville Municipal Golf Course"
find_photo "mcal-mcallen-muni" "McAllen Municipal Golf Course Texas"
find_photo "lrd-casa-blanca" "Casa Blanca Golf Course Laredo Texas"
find_photo "vic-victoria-muni" "Victoria Municipal Golf Course Texas"
find_photo "cc-gabe-lozano" "Gabe Lozano Golf Center Corpus Christi"
find_photo "cc-oso-beach" "Oso Beach Municipal Golf Course Corpus Christi"

# Houston / Gulf Coast
find_photo "hou-melrose-park" "Melrose Park Golf Course Houston"
find_photo "bay-baytown" "Evergreen Point Golf Club Baytown Texas"
find_photo "flk-friendswood" "Friendswood Golf Club Texas"
find_photo "lkj-lake-jackson" "Lake Jackson Golf Course Texas"
find_photo "moc-missouri-city" "Missouri City Golf Course Texas"
find_photo "pas-muni" "Pasadena Municipal Golf Course Texas"
find_photo "prl-pearland-golf" "Pearland Golf Club Country Place"
find_photo "sul-oyster-creek" "Oyster Creek Golf Course Sugar Land"
find_photo "cyp-longwood" "Longwood Golf Club Cypress Texas"
find_photo "con-west-fork" "West Fork Golf Club Conroe Texas"
find_photo "gal-galveston-island" "Galveston Island Golf Course"

# DFW suburbs
find_photo "arl-chester-w-ditto" "Chester W Ditto Golf Course Arlington Texas"
find_photo "gar-firewheel-lakes" "Firewheel Golf Park Lakes Garland"
find_photo "row-waterview" "Waterview Golf Club Rowlett Texas"
find_photo "ced-cedar-hill" "Cedar Hill Golf Course Texas"
find_photo "hst-hurst-hills" "Hurst Hills Golf Course Texas"
find_photo "den-eagle-pointe" "Eagle Pointe Golf Club Denton Texas"
find_photo "gp-tangle-ridge" "Tangle Ridge Golf Course Grand Prairie"
find_photo "rwk-rockwall" "Rockwall Golf Athletic Club Texas"
find_photo "grv-grapevine-golf" "Grapevine Golf Course Texas"
find_photo "wf-weeks-park" "Weeks Park Golf Course Wichita Falls"
find_photo "mw-mineral-wells" "Mineral Wells Golf Course Texas"
find_photo "wfd-weatherford" "Weatherford Golf Club Texas"
find_photo "grb-granbury" "Granbury Country Club Texas"

# Central TX / Austin area
find_photo "smk-springs-hill" "Springs Hill Golf Course San Marcos Texas"
find_photo "geo-georgetown-muni" "Georgetown Golf Course Texas"
find_photo "rr-old-settlers-park" "Old Settlers Park Golf Course Round Rock"
find_photo "cp-twin-creeks" "Twin Creeks Golf Club Cedar Park Texas"
find_photo "kil-skylark-field" "Skylark Field Golf Course Killeen Texas"
find_photo "tem-sammons" "Sammons Golf Course Temple Texas"

# West TX
find_photo "ep-ascarate" "Ascarate Municipal Golf Course El Paso"
find_photo "lub-shadow-hills" "Shadow Hills Golf Course Lubbock Texas"
find_photo "abi-maxwell" "Maxwell Municipal Golf Course Abilene"
find_photo "abi-willow-creek" "Willow Creek Golf Center Abilene Texas"
find_photo "ods-odessa" "Ratliff Ranch Golf Links Odessa Texas"

# East TX
find_photo "tyl-faulkner-park" "Faulkner Park Golf Course Tyler Texas"
find_photo "bmt-tyrrell-park" "Tyrrell Park Golf Course Beaumont Texas"
find_photo "luf-lufkin" "Lufkin Municipal Golf Course Texas"
find_photo "lng-longview" "Alpine Golf Course Longview Texas"
find_photo "nac-nacogdoches" "Woodland Hills Golf Course Nacogdoches"
find_photo "bcs-pebble-creek" "Pebble Creek Golf Course College Station"
find_photo "wac-cottonwood-creek" "Cottonwood Creek Golf Course Waco"
find_photo "ssp-sulphur-springs" "Sulphur Springs Golf Course Texas"
find_photo "mar-marshall" "Marshall Municipal Golf Course Texas"
find_photo "plt-palestine" "Palestine Country Club Texas"
find_photo "hen-henderson" "Henderson Golf Course Texas"

# Misc
find_photo "stp-stephenville" "Stephenville Golf Course Texas"
find_photo "pam-pampa" "Pampa Municipal Golf Course Texas"

echo "]" >> "$OUT"
echo ""
echo "Done. Results in $OUT"
cat "$OUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Found {len(d)} photos')"
