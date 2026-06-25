// Run on June 27, 2026: node outreach/send-batch1-followup.js
const RESEND_KEY = "REDACTED";

const contacts = [
  { to: "imcgraw@golfcedarcrest.com", course: "Cedar Crest Golf Course" },
  { to: "mdotch@bslgolf.com", course: "Hermann Park Golf Course" },
  { to: "info@riverside-gc.com", course: "Riverside Golf Course" },
  { to: "Henry.Cagigal@fortworthtexas.gov", course: "Pecan Valley Golf Courses" },
  { to: "Jordan.Fain@fortworthtexas.gov", course: "Rockwood Park Golf Course" },
  { to: "Raymond.Briggs@fortworthtexas.gov", course: "Meadowbrook Golf Course" }
];

async function sendFollowups() {
  for (const c of contacts) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "outreach@trackpassgolf.com",
        reply_to: "hello@trackpassgolf.com",
        to: [c.to],
        subject: `Re: TrackPass -- driving more rounds to ${c.course}`,
        text: `Hi there,\n\nFollowing up on my note from a few days ago about TrackPass.\n\nWe've had good traffic to your course page on trackpassgolf.com this week, and I wanted to check if you had a chance to take a look at the partner program.\n\nNo changes to your operation, no contracts. Our members show up with a digital pass, play at your standard rate, and we pay you. It's built for courses that want more weekday rounds without any extra marketing cost.\n\nThe partner sign-up takes about two minutes at trackpassgolf.com/partner.html, or just reply here with any questions.\n\nThanks,\nTrackPass\ntrackpassgolf.com`
      })
    });
    const data = await res.json();
    console.log(`${c.to}: ${data.id || JSON.stringify(data)}`);
  }
}

sendFollowups().catch(console.error);
