import Parser from "rss-parser";

const parser = new Parser({ timeout: 10000 });

// Well-known public RSS feeds - no API key needed, this is exactly what these
// feeds are published for (syndication).
const FEEDS = [
  { url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", source: "Times of India", region: "India" },
  { url: "https://feeds.feedburner.com/ndtvnews-top-stories", source: "NDTV", region: "India" },
  { url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", source: "Hindustan Times", region: "India" },
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC", region: "World" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera", region: "World" },
  { url: "http://rss.cnn.com/rss/edition_world.rss", source: "CNN", region: "World" },
];

// Fetches all feeds and returns a flat, deduped list of articles sorted by
// publish date (most recent first).
export async function fetchTrendingNews() {
  const allArticles = [];

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || []).slice(0, 15).map((item) => ({
        title: item.title,
        link: item.link,
        summary: (item.contentSnippet || item.content || "").slice(0, 400),
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: feed.source,
        region: feed.region,
      }));
      allArticles.push(...items);
    } catch (err) {
      console.error(`Failed to fetch feed ${feed.source}:`, err.message);
    }
  }

  // De-dupe by link (some feeds occasionally repeat items across pulls)
  const seen = new Set();
  const deduped = allArticles.filter((a) => {
    if (!a.link || seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  deduped.sort((a, b) => b.pubDate - a.pubDate);
  return deduped;
}
