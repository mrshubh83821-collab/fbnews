import fetch from "node-fetch";
import { withRetry } from "./retry.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Generates an ORIGINAL short Hinglish caption from the headline + a short
// snippet - never copies the source article's wording. Includes an
// engagement-driving question so readers are prompted to comment, which
// helps the post's reach. Also returns hashtags. The article link is NOT
// included here - it's appended separately in news-bot.js so Gemini never
// has to (and can't accidentally mangle) a real URL.
export async function generateNewsCaption(article) {
  const prompt = `You are writing a short Facebook post caption about a news story, in Hinglish (Hindi+English mix, casual, engaging tone). This must be written ENTIRELY IN YOUR OWN WORDS - do not copy any sentence from the source snippet below, just use it to understand what happened.

Headline: ${article.title}
Source snippet (for context only, do NOT copy phrasing from this): ${article.summary}
Region: ${article.region}

Write exactly 3 parts, each on its own line(s):
1. A short original 2-3 line summary of what happened, in Hinglish, engaging but factual (no clickbait, no exaggeration, no fabricated details).
2. One short engagement question in Hinglish that invites readers to comment their opinion on this specific story (not generic - tie it to the story). Example style: "Aapko kya lagta hai, ye sahi faisla tha?" - but make it specific to THIS story.
3. Then 4-5 relevant hashtags (mix of Hindi/English, topical to the story, plus #News).

Keep the whole thing under 65 words. Respond with ONLY the caption text, nothing else - no labels like "Summary:" or "Question:".`;

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
  return text ? text.trim() : `${article.title}\n\nAapka kya khayal hai? Comment mein batao!\n\n#News #Trending`;
}
