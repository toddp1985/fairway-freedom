#!/usr/bin/env python3
"""Upgrade city hub pages to location-page SEO template (2026-07-01).

Per hub: exact-match title/H1, green-fee table, visible FAQ + FAQPage JSON-LD,
mid-page CTA band with guide lead magnet, analytics.js + waitlist.js includes.
AICitationBox stays the last visible element before the footer.
"""
import re, json, html as htmlmod
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
hubs = sorted((ROOT / "courses").glob("*/index.html"))
changed = skipped = 0

for hub in hubs:
    src = hub.read_text()
    slug = hub.parent.name                      # e.g. fort-worth-tx
    city = " ".join(w.capitalize() for w in slug.rsplit("-tx", 1)[0].split("-"))

    if "hub-faq" in src:                        # already upgraded
        skipped += 1
        continue

    # ---- parse course cards: name + fee ----
    cards = re.findall(
        r'<h3[^>]*>([^<]+)</h3>\s*<p[^>]*>[^<]*?~\$(\d+)/round', src)
    if not cards:
        cards = [(m, None) for m in re.findall(r'<h3[^>]*>([^<]+)</h3>', src)]
    names = [htmlmod.unescape(n).strip() for n, _ in cards]
    fees = [int(f) for _, f in cards if f]
    n = len(names)
    if n == 0:
        skipped += 1
        continue

    # ---- title / h1 / metas ----
    plural = "Courses" if n != 1 else "Course"
    new_title = f"Public Golf {plural} in {city}, TX — Green Fees &amp; $199 Golf Pass | TrackPass"
    src = re.sub(r"<title>.*?</title>", f"<title>{new_title}</title>", src, count=1, flags=re.S)
    src = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                 rf'\g<1>Public Golf {plural} in {city}, TX — TrackPass\g<2>', src, count=1)
    src = re.sub(r"(<h1[^>]*>)[^<]+(</h1>)",
                 rf"\g<1>Public Golf {plural} in {city}, Texas\g<2>", src, count=1)

    fee_note = ""
    if fees:
        lo, hi = min(fees), max(fees)
        fee_note = (f" Green fees run about ${lo}–${hi} a round." if lo != hi
                    else f" Green fees run about ${lo} a round.")

    course_list = ", ".join(names[:8]) + ("…" if n > 8 else "")

    # ---- FAQ content (kept honest: capped-reimbursement model) ----
    faqs = [
        (f"How many public golf courses are in {city}, Texas?",
         f"{n} {city}-area public {'courses are' if n != 1 else 'course is'} in the TrackPass directory: {course_list}.{fee_note}"),
        (f"What is the cheapest way to play golf in {city}?",
         f"Municipal and daily-fee courses are the cheapest tee times in {city}.{fee_note} A TrackPass membership ($199/year) reimburses your green fee up to $50 a round — one round a month, up to $199 back per year — which can cover most of what a regular {city} golfer spends on green fees."),
        (f"How does TrackPass work at {city} courses?",
         f"Pay the green fee at any {city} public course like normal, log the round in your TrackPass dashboard, and email the receipt to reimbursements@trackpassgolf.com. You're reimbursed up to $50 for that round (one round per month, capped at $199 per membership year). At partner courses you get 2 free rounds a year — just show your pass."),
        ("Do I need to book tee times through TrackPass?",
         "No. Book directly with the course the way you always do — by phone or their online tee sheet. TrackPass isn't a booking site; it pays you back after you play."),
    ]

    faq_ld = json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a}}
                       for q, a in faqs]}, ensure_ascii=False)
    src = src.replace("</head>",
        f'<script type="application/ld+json">{faq_ld}</script>\n</head>', 1)

    # ---- fee table ----
    rows = ""
    for (name, fee) in cards:
        name_e = htmlmod.escape(htmlmod.unescape(name).strip())
        if fee:
            f = int(fee)
            net = "$0 (fully reimbursed)" if f <= 50 else f"${f - 50}"
            rows += (f'<tr><td style="padding:0.5rem 0.75rem;border-bottom:1px solid #e5e7eb">{name_e}</td>'
                     f'<td style="padding:0.5rem 0.75rem;border-bottom:1px solid #e5e7eb">~${f}</td>'
                     f'<td style="padding:0.5rem 0.75rem;border-bottom:1px solid #e5e7eb;color:#166534;font-weight:600">{net}</td></tr>')
        else:
            rows += (f'<tr><td style="padding:0.5rem 0.75rem;border-bottom:1px solid #e5e7eb">{name_e}</td>'
                     f'<td style="padding:0.5rem 0.75rem;border-bottom:1px solid #e5e7eb">varies</td>'
                     f'<td style="padding:0.5rem 0.75rem;border-bottom:1px solid #e5e7eb;color:#166534;font-weight:600">up to $50 back</td></tr>')

    fee_table = f"""
<section style="max-width:64rem;margin:2.5rem auto 0;padding:0 1.5rem">
  <h2 style="font-family:Sora,sans-serif;font-size:1.35rem;font-weight:800;margin:0 0 0.75rem;color:#002113">What golf costs in {city} — with and without TrackPass</h2>
  <p style="font-size:0.9rem;color:#444;margin:0 0 1rem;line-height:1.6">TrackPass reimburses up to $50 per round (one round a month, up to $199 back per membership year). Here's the math at {city}'s public courses:</p>
  <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:white;border-radius:0.75rem;box-shadow:0 1px 4px rgba(0,0,0,.08);font-size:0.875rem">
    <thead><tr style="background:#16412b;color:white;text-align:left">
      <th style="padding:0.6rem 0.75rem;border-radius:0.75rem 0 0 0">Course</th>
      <th style="padding:0.6rem 0.75rem">Typical green fee</th>
      <th style="padding:0.6rem 0.75rem;border-radius:0 0.75rem 0 0">Your cost after reimbursement</th>
    </tr></thead><tbody>{rows}</tbody></table></div>
</section>"""

    # ---- CTA band (lead magnet + pass) ----
    cta = f"""
<section style="max-width:64rem;margin:2.5rem auto 0;padding:0 1.5rem">
  <div style="background:linear-gradient(135deg,#16412b,#0c2a1b);border-radius:1rem;padding:2rem 1.5rem;text-align:center">
    <h2 style="font-family:Sora,sans-serif;font-size:1.3rem;font-weight:800;color:white;margin:0 0 0.5rem">Play more {city} golf for less</h2>
    <p style="color:#bbf7d0;font-size:0.9rem;margin:0 0 1.25rem;line-height:1.6">$199/year. Up to $199 back in green fees. 30-day money-back guarantee.</p>
    <a href="/plans.html" style="display:inline-block;background:#fde047;color:#002113;font-weight:800;padding:0.75rem 1.75rem;border-radius:999px;text-decoration:none;font-size:0.95rem">Get TrackPass — $199/yr</a>
    <p style="margin:1rem 0 0"><a href="#guide" data-waitlist style="color:#86efac;font-size:0.85rem;text-decoration:underline">Not ready? Grab the free Texas Muni Golf Guide →</a></p>
  </div>
</section>"""

    # ---- visible FAQ ----
    faq_items = "".join(
        f"""<details style="background:white;border-radius:0.75rem;box-shadow:0 1px 4px rgba(0,0,0,.08);padding:1rem 1.25rem;margin-bottom:0.75rem">
<summary style="font-family:Sora,sans-serif;font-weight:700;font-size:0.95rem;color:#002113;cursor:pointer">{htmlmod.escape(q)}</summary>
<p style="font-size:0.875rem;color:#333;line-height:1.65;margin:0.75rem 0 0">{htmlmod.escape(a)}</p>
</details>""" for q, a in faqs)

    faq_html = f"""
<section id="hub-faq" style="max-width:64rem;margin:2.5rem auto 0;padding:0 1.5rem 1rem">
  <h2 style="font-family:Sora,sans-serif;font-size:1.35rem;font-weight:800;margin:0 0 1rem;color:#002113">{city} golf — common questions</h2>
  {faq_items}
</section>"""

    src = src.replace("</main>", fee_table + cta + faq_html + "\n</main>", 1)

    # ---- scripts (analytics + guide modal) ----
    if "analytics.js" not in src:
        src = src.replace("</body>",
            '<script defer src="/assets/analytics.js"></script>\n'
            '<script defer src="/assets/waitlist.js"></script>\n</body>', 1)

    hub.write_text(src)
    changed += 1

print(f"upgraded {changed} hubs, skipped {skipped}")
