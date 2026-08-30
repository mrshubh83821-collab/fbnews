import fetch from "node-fetch";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function searchUnsplash(keyword) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    keyword
  )}&per_page=5&orientation=squarish&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    console.log(`Unsplash API failed for "${keyword}" (${res.status}): ${errText}`);
    return null;
  }
  const data = await res.json();
  const results = data.results || [];
  if (results.length === 0) {
    console.log(`Unsplash returned 0 results for "${keyword}"`);
    return null;
  }
  const pick = results[Math.floor(Math.random() * results.length)];
  console.log(`Found stock photo for "${keyword}": ${pick.urls.regular}`);
  return pick.urls.regular;
}

/**
 * Tries the story-specific keyword first (e.g. "flood disaster"). If that
 * returns no results (common for very specific/sensitive terms), it tries a
 * couple of broader, more reliably-matched fallback keywords before giving
 * up - this keeps most posts photo-based instead of falling back to the
 * plain solid-color card.
 */
export async function fetchStockPhotoUrl(keyword, region) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log("No UNSPLASH_ACCESS_KEY set - skipping stock photo, using fallback design.");
    return null;
  }

  const genericFallback = region === "India" ? "india city skyline" : "world map globe";
  const candidates = [keyword, genericFallback, "newspaper background"];

  for (const candidate of candidates) {
    try {
      const url = await searchUnsplash(candidate);
      if (url) return url;
    } catch (err) {
      console.log(`Unsplash fetch threw an error for "${candidate}": ${err.message}`);
    }
  }

  console.log("All stock photo attempts failed - using solid-color fallback design.");
  return null;
}
