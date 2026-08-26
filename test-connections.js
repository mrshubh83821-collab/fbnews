import fetch from "node-fetch";
import { fetchTrendingNews } from "./lib/news-source.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

async function testRSS() {
  const articles = await fetchTrendingNews();
  if (articles.length > 0) {
    console.log(`✅ RSS Feeds OK - fetched ${articles.length} articles`);
  } else {
    console.log(`❌ RSS Feeds FAILED - got 0 articles, check feed URLs`);
  }
}

async function testGemini() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Say OK" }] }] }),
    }
  );
  if (res.ok) {
    console.log("✅ Gemini API OK");
  } else {
    const text = await res.text();
    console.log(`❌ Gemini API FAILED - ${res.status} ${text}`);
  }
}

async function testFacebook() {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${FB_PAGE_ID}?fields=name&access_token=${FB_PAGE_ACCESS_TOKEN}`
  );
  const data = await res.json();
  if (res.ok) {
    console.log(`✅ Facebook Page OK - connected to: ${data.name}`);
  } else {
    console.log(`❌ Facebook FAILED - ${JSON.stringify(data)}`);
  }
}

async function run() {
  console.log("Testing all connections...\n");
  await testRSS();
  await testGemini();
  await testFacebook();
  console.log("\nDone. Fix any ❌ before running the real bot.");
}

run();
