import { execSync } from "child_process";
import fs from "fs";

const WIDTH = 1080;
const HEIGHT = 1080;
const DURATION = 10; // seconds

/**
 * Wraps an already-composed static image (the news card, with headline text
 * already baked in) into a short vertical-friendly video with a subtle Ken
 * Burns zoom - turning a static photo post into a Reel, which gets far more
 * organic reach on Facebook than a plain photo.
 */
export function wrapImageAsReel({ imagePath, outputPath, tmpDir, audioPath }) {
  fs.mkdirSync(tmpDir, { recursive: true });

  const framesTotal = DURATION * 25; // 25 fps
  const filter = `[0:v]scale=${WIDTH * 2}:${HEIGHT * 2},zoompan=z='min(zoom+0.0006,1.2)':d=${framesTotal}:s=${WIDTH}x${HEIGHT}:fps=25[zoomed]`;

  const hasAudio = audioPath && fs.existsSync(audioPath);
  const cmd = hasAudio
    ? `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -filter_complex "${filter}" -map "[zoomed]" -map 1:a -shortest -t ${DURATION} -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k "${outputPath}"`
    : `ffmpeg -y -loop 1 -i "${imagePath}" -filter_complex "${filter}" -map "[zoomed]" -t ${DURATION} -c:v libx264 -pix_fmt yuv420p "${outputPath}"`;

  execSync(cmd, { stdio: "pipe" });
  return outputPath;
}
