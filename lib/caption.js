import fetch from "node-fetch";
import { withRetry } from "./retry.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Generates an ORIGINAL short Hinglish caption (summary + engagement question
// + hashtags) plus a short English keyword describing the story's visual
// theme (e.g. "flood", "election rally", "cricket match") - used only to
// search for a relevant free stock photo, never to copy the source article.
export async function generateNewsCaption(article) {
  const prompt = `You are writing a short Facebook post caption about a news story, in Hinglish (Hindi+English mix, casual, engaging tone). This must be written ENTIRELY IN YOUR OWN WORDS - do not copy any sentence from the source snippet below, just use it to understand what happened.

Headline: ${article.title}
Source snippet (for context only, do NOT copy phrasing from this): ${article.summary}
Region: ${article.region}

Respond with exactly 4 lines, in this exact format (no extra text, no markdown):
SUMMARY: <2-3 line original Hinglish summary of what happened, factual, no exaggeration>
QUESTION: <one short Hinglish question inviting readers to comment their opinion, specific to this story>
HASHTAGS: <4-5 relevant hashtags, mix of Hindi/English, topical to the story, plus #News>
KEYWORD: <a single short English phrase (2-4 words) describing a generic visual theme for this story that could be used to search a stock photo library - e.g. "flood disaster", "election rally", "cricket stadium", "stock market", "courtroom". Do NOT name specific people or places, keep it generic.>`;

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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const summary = (text.match(/SUMMARY:\s*(.+)/i) || [])[1]?.trim();
  const question = (text.match(/QUESTION:\s*(.+)/i) || [])[1]?.trim();
  const hashtags = (text.match(/HASHTAGS:\s*(.+)/i) || [])[1]?.trim();
  const keyword = (text.match(/KEYWORD:\s*(.+)/i) || [])[1]?.trim();

  const caption =
    summary && question && hashtags
      ? `${summary}\n\n${question}\n\n${hashtags}`
      : `${article.title}\n\nAapka kya khayal hai? Comment mein batao!\n\n#News #Trending`;

  return {
    caption,
    keyword: keyword || (article.region === "India" ? "india news" : "world news"),
  };
}
