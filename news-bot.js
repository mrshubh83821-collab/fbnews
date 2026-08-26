import fs from "fs";
import { fetchTrendingNews } from "./lib/news-source.js";
import { generateNewsCaption } from "./lib/caption.js";
import { postNewsLink } from "./lib/facebook-post.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

const STATE_FILE = "./state/posted.json";
const MAX_HISTORY = 1000; // news moves fast, keep a bigger history than the movie bot

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { posted: [] };
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return { posted: [] };
  }
}

function saveState(state) {
  fs.mkdirSync("./state", { recursive: true });
  state.posted = state.posted.slice(-MAX_HISTORY);
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function pickArticle(articles, alreadyPosted) {
  return articles.find((a) => !alreadyPosted.includes(a.link)) || null;
}

async function main() {
  console.log("Starting News Bot run...");

  if (!GEMINI_API_KEY || !FB_PAGE_ID || !FB_PAGE_ACCESS_TOKEN) {
    throw new Error("Missing required environment variables. Need: GEMINI_API_KEY, FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN");
  }

  const state = loadState();
  const articles = await fetchTrendingNews();
  console.log(`Fetched ${articles.length} articles from RSS feeds.`);

  const article = pickArticle(articles, state.posted);
  if (!article) {
    console.log("No new/unposted article found this run. Skipping.");
    return;
  }

  console.log(`Selected: [${article.source}/${article.region}] ${article.title}`);

  const caption = await generateNewsCaption(article);
  console.log("Generated caption:\n", caption);

  const result = await postNewsLink(article, caption);
  console.log("Posted to Facebook successfully:", result.id);

  state.posted.push(article.link);
  saveState(state);

  console.log("Run complete.");
}

main().catch((err) => {
  console.error("Bot run failed:", err.message);
  process.exit(1);
});
