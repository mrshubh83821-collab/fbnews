import fetch from "node-fetch";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Fetches a free, topic-relevant stock photo URL from Unsplash (NOT the real
// event photo - just a generic image matching the story's theme, e.g. a
// "flood" photo for flood news). This is fully legal under Unsplash's free
// license, unlike using a publisher's actual news photography.
export async function fetchStockPhotoUrl(keyword) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log("No UNSPLASH_ACCESS_KEY set - skipping stock photo, using fallback design.");
    return null;
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      keyword
    )}&per_page=5&orientation=squarish&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.log(`Unsplash API failed (${res.status}): ${errText}`);
      return null;
    }
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) {
      console.log(`Unsplash returned 0 results for keyword: "${keyword}"`);
      return null;
    }
    const pick = results[Math.floor(Math.random() * results.length)];
    console.log(`Found stock photo for "${keyword}": ${pick.urls.regular}`);
    return pick.urls.regular;
  } catch (err) {
    console.log(`Unsplash fetch threw an error: ${err.message}`);
    return null;
  }
}
