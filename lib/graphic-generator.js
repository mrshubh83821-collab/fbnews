import { execSync } from "child_process";
import fs from "fs";

const WIDTH = 1080;
const HEIGHT = 1080; // square - performs well across all Facebook placements

// Wraps text into lines of roughly maxCharsPerLine characters, breaking on
// word boundaries. ffmpeg's drawtext has no auto-wrap, so we do it ourselves.
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
 * Generates a native "news card" image (no publisher photos - fully original
 * design) with a category badge, wrapped headline text, and source name.
 * Background color varies by region so India/World stories are visually
 * distinct at a glance.
 */
export function generateNewsCard({ headline, source, region, outputPath, tmpDir }) {
  fs.mkdirSync(tmpDir, { recursive: true });

  const bgColor = region === "India" ? "0x8B1A1A" : "0x1A3A6B"; // deep red vs deep blue
  const badgeText = region === "India" ? "INDIA NEWS" : "WORLD NEWS";

  const headlineLines = wrapText(headline, 24).slice(0, 5); // cap at 5 lines
  const lineHeight = 76;
  const totalTextHeight = headlineLines.length * lineHeight;
  const startY = (HEIGHT - totalTextHeight) / 2 - 20;

  const filters = [];
  let lastLabel = "0:v";

  // Category badge near the top
  filters.push(
    `[${lastLabel}]drawtext=text='${badgeText}':fontcolor=white:fontsize=42:font=Sans-Bold:x=(w-text_w)/2:y=90[badge]`
  );
  lastLabel = "badge";

  // Headline, wrapped across multiple centered lines
  headlineLines.forEach((line, i) => {
    const nextLabel = `h${i}`;
    const y = startY + i * lineHeight;
    filters.push(
      `[${lastLabel}]drawtext=text='${escapeForDrawtext(line)}':fontcolor=white:fontsize=58:font=Sans-Bold:x=(w-text_w)/2:y=${y}[${nextLabel}]`
    );
    lastLabel = nextLabel;
  });

  // Source attribution near the bottom
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
