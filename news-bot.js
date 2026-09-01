import fs from "fs";
import path from "path";
import { fetchTrendingNews } from "./lib/news-source.js";
import { generateNewsCaption } from "./lib/caption.js";
import { generateNewsCard } from "./lib/graphic-generator.js";
import { wrapImageAsReel } from "./lib/video-wrap.js";
import { postReelToFacebook } from "./lib/facebook-reel.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

const STATE_FILE = "./state/posted.json";
const MAX_HISTORY = 1000;
const TMP_DIR = "./tmp-news";
const AUDIO_DIR = "./assets/audio";

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

function pickRandomAudio() {
  if (!fs.existsSync(AUDIO_DIR)) return null;
  const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".mp3") || f.endsWith(".m4a"));
  if (files.length === 0) return null;
  return path.join(AUDIO_DIR, files[Math.floor(Math.random() * files.length)]);
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

  const { caption, keyword } = await generateNewsCaption(article);
  console.log("Generated caption:\n", caption);
  console.log("Stock photo search keyword:", keyword);

  const fullCaption = `${caption}\n\nPura article yahan padhein: ${article.link}`;

  const cardPath = `${TMP_DIR}/card.jpg`;
  console.log("Generating native graphic card...");
  await generateNewsCard({
    headline: article.title,
    source: article.source,
    region: article.region,
    keyword,
    outputPath: cardPath,
    tmpDir: TMP_DIR,
  });
  console.log("Graphic generated:", cardPath);

  const reelPath = `${TMP_DIR}/reel.mp4`;
  const audioPath = pickRandomAudio();
  console.log("Wrapping graphic into a Reel...");
  wrapImageAsReel({ imagePath: cardPath, outputPath: reelPath, tmpDir: TMP_DIR, audioPath });
  console.log("Reel generated:", reelPath);

  const result = await postReelToFacebook(reelPath, fullCaption);
  console.log("Posted to Facebook successfully:", result.id || result.video_id);

  state.posted.push(article.link);
  saveState(state);

  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log("Run complete.");
}

main().catch((err) => {
  console.error("Bot run failed:", err.message);
  process.exit(1);
});
