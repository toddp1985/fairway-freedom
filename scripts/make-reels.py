#!/usr/bin/env python3
"""Generate photo-motion reels (1080x1920, 15s) from course photos.

Output: assets/reels/reel-<id>.mp4 + assets/reels/manifest.json
Served on GH Pages so the worker can feed public URLs to the IG Reels API.
Copy rules: capped-reimbursement model only — never "free anywhere",
reimbursement always framed as up to $50/round, 1 round/month, $199/yr cap.

Usage: python3 scripts/make-reels.py            # featured courses w/ local photos
"""
import json, re, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "reels"
OUT.mkdir(exist_ok=True)
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
W, H = 1080, 1920

data = (ROOT / "assets" / "courses-data.js").read_text()
courses = json.loads(re.search(r"window\.TRACKPASS_COURSES = (\[.*?\]);", data, re.S).group(1))

def hooks(c):
    fee, city, name = c.get("fee") or 40, c["city"], c["name"]
    if c.get("partner"):
        return [
            (540, f"{name}", 60, "w"),
            (640, f"{city}, Texas", 46, "w"),
            (860, "Partner course: show your pass,", 56, "w"),
            (950, "play free. 2 rounds a year.", 56, "y"),
            (1560, "$199/yr · trackpassgolf.com", 44, "w"),
        ]
    variants = [
        [(540, f"{city} golf: ~${fee} a round", 58, "w"),
         (840, "TrackPass pays you back up to $50", 52, "w"),
         (930, "(1 round/mo, up to $199/yr)", 44, "y"),
         (1560, "$199/yr · trackpassgolf.com", 44, "w")],
        [(540, "Green fees add up.", 62, "w"),
         (840, "Get up to $199/yr of them back.", 54, "y"),
         (930, f"Like here — {name}.", 44, "w"),
         (1560, "trackpassgolf.com", 44, "w")],
        [(540, "95 Texas public courses.", 58, "w"),
         (630, "One $199 pass.", 58, "y"),
         (860, f"Play {name}, send the receipt,", 46, "w"),
         (950, "get up to $50 back. Once a month.", 46, "w"),
         (1560, "trackpassgolf.com", 44, "w")],
    ]
    return variants[sum(map(ord, c["id"])) % len(variants)]

def make_overlay(lines, path):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y, txt, sz, col in lines:
        f = ImageFont.truetype(FONT, sz)
        while d.textlength(txt, font=f) > W - 90 and sz > 30:
            sz -= 2
            f = ImageFont.truetype(FONT, sz)
        w = d.textlength(txt, font=f)
        fill = (253, 224, 71, 255) if col == "y" else (255, 255, 255, 255)
        d.text(((W - w) / 2, y), txt, font=f, fill=fill,
               stroke_width=6, stroke_fill=(0, 20, 10, 220))
    img.save(path)

manifest = []
made = 0
for c in courses:
    photo = c.get("photo")
    if not photo:
        continue
    src = ROOT / photo
    if not src.exists():
        continue
    im = Image.open(src)
    if im.width < 700:                       # too soft for 1080 vertical
        continue
    out = OUT / f"reel-{c['id']}.mp4"
    if out.exists():
        manifest.append({"file": f"assets/reels/{out.name}", "courseId": c["id"]})
        continue
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tf:
        make_overlay(hooks(c), tf.name)
        fc = ("[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
              "crop=1080:1920,"
              "zoompan=z='1.0+0.15*on/450':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
              ":d=450:s=1080x1920:fps=30,format=yuv420p[bg];"
              "[bg][1:v]overlay=0:0,format=yuv420p")
        r = subprocess.run(["ffmpeg", "-y", "-loop", "1", "-i", str(src), "-i", tf.name,
                            "-filter_complex", fc, "-t", "15", "-r", "30",
                            "-c:v", "libx264", "-preset", "fast", "-crf", "24",
                            "-movflags", "+faststart", str(out)],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print("FAIL", c["id"], r.stderr[-200:])
            continue
    manifest.append({"file": f"assets/reels/{out.name}", "courseId": c["id"]})
    made += 1
    print("made", out.name, c["name"])

(OUT / "manifest.json").write_text(json.dumps(manifest, indent=1))
print(f"total reels: {len(manifest)} (new: {made})")
