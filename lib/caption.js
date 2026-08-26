import fetch from "node-fetch";
import { withRetry } from "./retry.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Generates an ORIGINAL short Hinglish caption from the headline + a short
// snippet - never copies the source article's wording. Also returns hashtags.
export async function generateNewsCaption(article) {
  const prompt = `You are writing a short Facebook post caption about a news story, in Hinglish (Hindi+English mix, casual, engaging tone). This must be written ENTIRELY IN YOUR OWN WORDS - do not copy any sentence from the source snippet below, just use it to understand what happened.

Headline: ${article.title}
Source snippet (for context only, do NOT copy phrasing from this): ${article.summary}
Region: ${article.region}

Write:
1. A short original 2-3 line summary of what happened, in Hinglish, engaging but factual (no clickbait, no exaggeration).
2. Then on a new line, 4-5 relevant hashtags (mix of Hindi/English, topical to the story, plus #News).

Keep the whole thing under 70 words. Respond with ONLY the caption text, nothing else.`;

  const response = await withRetry(() =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    ).then(async (res) => {
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API failed: ${res.status} ${errText}`);
      }
      return res;
    })
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : `${article.title}\n\n#News #Trending`;
}
