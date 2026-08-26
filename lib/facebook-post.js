import fetch from "node-fetch";

const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

// Posts a link-share post to the Facebook Page. Facebook automatically
// generates a preview (title/image/description) from the linked article's
// page itself - this is the standard, safe way to share news, same as any
// person sharing a news link normally.
export async function postNewsLink(article, caption) {
  const url = `https://graph.facebook.com/v21.0/${FB_PAGE_ID}/feed`;
  const params = new URLSearchParams({
    message: caption,
    link: article.link,
    access_token: FB_PAGE_ACCESS_TOKEN,
  });

  const res = await fetch(`${url}?${params.toString()}`, { method: "POST" });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Facebook post failed: ${JSON.stringify(data)}`);
  }

  return data;
}
