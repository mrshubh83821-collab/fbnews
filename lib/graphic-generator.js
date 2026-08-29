import { execSync } from "child_process";
import fs from "fs";
import https from "https";
import { fetchStockPhotoUrl } from "./stock-photo.js";

const WIDTH = 1080;
const HEIGHT = 1080;

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });
}

function wrapText(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeForDrawtext(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\u2019")
    .replace(/%/g, "\\%");
}

/**
 * Generates a "news card" image in the style of major news pages: a
 * topic-relevant free stock photo (NOT the real event photo) as the
 * background, with a dark gradient band at the bottom holding the wrapped
 * headline and source attribution - similar visual language to how
 * broadcasters present headline cards, but built entirely from our own
 * design + a licensed stock photo, never the publisher's own photography.
 *
 * Falls back to a plain solid-color card (no photo) if no stock photo can
 * be found, so the bot never fails a run just because of a missing image.
 */
export async function generateNewsCard({ headline, source, region, keyword, outputPath, tmpDir }) {
  fs.mkdirSync(tmpDir, { recursive: true });

  const photoUrl = await fetchStockPhotoUrl(keyword);
  const badgeText = region === "India" ? "INDIA NEWS" : "WORLD NEWS";
  const headlineLines = wrapText(headline, 30).slice(0, 5);

  if (photoUrl) {
    const photoPath = `${tmpDir}/bg.jpg`;
    await downloadImage(photoUrl, photoPath);

    const bandHeight = 480; // dark band height at the bottom holding the text
    const lineHeight = 58;
    const textStartY = HEIGHT - bandHeight + 90;

    const filters = [
      `[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}[bg]`,
      `[bg]drawbox=x=0:y=${HEIGHT - bandHeight}:w=${WIDTH}:h=${bandHeight}:color=black@0.62:t=fill[banded]`,
      `[banded]drawbox=x=30:y=40:w=280:h=64:color=black@0.55:t=fill[badgebox]`,
      `[badgebox]drawtext=text='${badgeText}':fontcolor=white:fontsize=32:font=Sans-Bold:x=52:y=60[withbadge]`,
    ];
    let lastLabel = "withbadge";

    headlineLines.forEach((line, i) => {
      const nextLabel = `h${i}`;
      const y = textStartY + i * lineHeight;
      filters.push(
        `[${lastLabel}]drawtext=text='${escapeForDrawtext(
          line
        )}':fontcolor=white:fontsize=48:font=Sans-Bold:x=50:y=${y}[${nextLabel}]`
      );
      lastLabel = nextLabel;
    });

    filters.push(
      `[${lastLabel}]drawtext=text='Source\\: ${escapeForDrawtext(source)}':fontcolor=0xCCCCCC:fontsize=28:font=Sans:x=50:y=${
        HEIGHT - 50
      }[final]`
    );

    const cmd = `ffmpeg -y -i "${photoPath}" -filter_complex "${filters.join(
      ";"
    )}" -map "[final]" -frames:v 1 "${outputPath}"`;
    execSync(cmd, { stdio: "pipe" });
    return outputPath;
  }

  // ---------- Fallback: no stock photo found - plain solid-color card ----------
  const bgColor = region === "India" ? "0x8B1A1A" : "0x1A3A6B";
  const lineHeight = 76;
  const totalTextHeight = headlineLines.length * lineHeight;
  const startY = (HEIGHT - totalTextHeight) / 2 - 20;

  const filters = [
    `[0:v]drawtext=text='${badgeText}':fontcolor=white:fontsize=42:font=Sans-Bold:x=(w-text_w)/2:y=90[badge]`,
  ];
  let lastLabel = "badge";
  headlineLines.forEach((line, i) => {
    const nextLabel = `h${i}`;
    const y = startY + i * lineHeight;
    filters.push(
      `[${lastLabel}]drawtext=text='${escapeForDrawtext(
        line
      )}':fontcolor=white:fontsize=58:font=Sans-Bold:x=(w-text_w)/2:y=${y}[${nextLabel}]`
    );
    lastLabel = nextLabel;
  });
  filters.push(
    `[${lastLabel}]drawtext=text='Source\\: ${escapeForDrawtext(source)}':fontcolor=white:fontsize=32:font=Sans:x=(w-text_w)/2:y=${
      HEIGHT - 100
    }[final]`
  );

  const cmd = `ffmpeg -y -f lavfi -i "color=c=${bgColor}:s=${WIDTH}x${HEIGHT}" -filter_complex "${filters.join(
    ";"
  )}" -map "[final]" -frames:v 1 "${outputPath}"`;
  execSync(cmd, { stdio: "pipe" });
  return outputPath;
}
