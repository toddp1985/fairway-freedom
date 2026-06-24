#!/usr/bin/env node
/**
 * fetch-course-photos.js
 * Fetches the best Google Places photo for each course in courses-data.js
 * that currently has photo: null.
 *
 * Setup:
 *   1. Enable Places API (New) in Google Cloud Console
 *   2. Set GOOGLE_PLACES_KEY env var
 *   3. Run: node scripts/fetch-course-photos.js
 *
 * Cost: ~$17/1000 Text Search calls + $17/1000 photo requests = ~$3.40 for 100 courses.
 * Real-world: 93 courses x2 calls = $1.58 total (well under free tier $200/mo).
 */

const fs = require('fs');
const path = require('path');

const KEY = process.env.GOOGLE_PLACES_KEY;
if (!KEY) {
  console.error('Set GOOGLE_PLACES_KEY env var first.');
  process.exit(1);
}

const DATA_FILE = path.join(__dirname, '../assets/courses-data.js');
const raw = fs.readFileSync(DATA_FILE, 'utf8');
// Strip JS module wrapper to get JSON array
const jsonStart = raw.indexOf('[');
const jsonEnd = raw.lastIndexOf(']') + 1;
const courses = JSON.parse(raw.slice(jsonStart, jsonEnd));

const nullCourses = courses.filter(c => !c.photo);
console.log(`Fetching photos for ${nullCourses.length} courses...`);

async function searchPlace(name, city) {
  const query = `${name} golf course ${city} Texas`;
  const url = `https://places.googleapis.com/v1/places:searchText`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'places.id,places.photos'
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 })
  });
  const data = await res.json();
  return data.places?.[0];
}

async function getPhotoUrl(photoName) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&maxWidthPx=1200&key=${KEY}&skipHttpRedirect=true`;
  const res = await fetch(url);
  const data = await res.json();
  return data.photoUri || null;
}

async function main() {
  const updates = {};
  let done = 0;

  for (const course of nullCourses) {
    try {
      const place = await searchPlace(course.name, course.city);
      if (!place || !place.photos?.length) {
        console.log(`  [skip] ${course.name} — no Places result`);
        done++;
        continue;
      }
      const photoUrl = await getPhotoUrl(place.photos[0].name);
      if (photoUrl) {
        updates[course.id] = photoUrl;
        console.log(`  [ok]   ${course.name} → ${photoUrl.slice(0, 80)}...`);
      } else {
        console.log(`  [skip] ${course.name} — photo URL empty`);
      }
      done++;
      // Brief pause to avoid rate limiting
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.error(`  [err]  ${course.name}: ${e.message}`);
      done++;
    }
  }

  if (Object.keys(updates).length === 0) {
    console.log('No photos found.');
    return;
  }

  // Patch courses-data.js
  let updated = raw;
  for (const [id, photoUrl] of Object.entries(updates)) {
    // Replace "photo": null for this course id
    // Find the block containing this id and replace its photo field
    updated = updated.replace(
      new RegExp(`("id": "${id}"[^}]*?"photo": )null`),
      `$1"${photoUrl}"`
    );
  }

  fs.writeFileSync(DATA_FILE, updated);
  console.log(`\nDone. Updated ${Object.keys(updates).length} courses in ${DATA_FILE}`);
  console.log('Run: git add assets/courses-data.js && git commit -m "photos: add Google Places photos for courses" && git push');
}

main().catch(console.error);
