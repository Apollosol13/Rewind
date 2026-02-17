import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

/**
 * Process a video to add polaroid framing using FFmpeg.
 * Downloads the video from URL, adds white border + rainbow stripe,
 * and returns the processed video as a Buffer.
 * 
 * @param {Buffer} videoBuffer - Raw video buffer
 * @param {string} caption - Optional caption text
 * @param {Date} date - Date for the polaroid
 * @returns {Promise<Buffer>} - Processed video buffer
 */
export async function createPolaroidVideo(videoBuffer, caption, date) {
  let tempDir;

  try {
    // Create temp directory for processing
    tempDir = await mkdtemp(join(tmpdir(), 'rewind-video-'));
    const inputPath = join(tempDir, 'input.mp4');
    const outputPath = join(tempDir, 'output.mp4');

    // Write input video to temp file
    await writeFile(inputPath, videoBuffer);

    const dateStr = (date || new Date()).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    // Sanitize caption for FFmpeg (escape special characters)
    const safeCaption = (caption || '').replace(/[':]/g, '').replace(/\\/g, '').substring(0, 40);

    // Font paths (Caveat handwriting font bundled in repo)
    const fontRegular = join(__dirname, '..', 'fonts', 'Caveat-Regular.ttf');
    const fontBold = join(__dirname, '..', 'fonts', 'Caveat-Bold.ttf');

    // FFmpeg filter chain for polaroid look (matching photo share format):
    // 1. Crop to square (center crop)
    // 2. Scale to 540x540
    // 3. Pad with white: 40px sides, 50px top, 140px bottom (more room for text)
    // 4. Rainbow stripe (6 colored boxes at top center)
    // 5. Date text (left side, below image - handwriting style)
    // 6. Caption text (left side, below date - larger handwriting)
    // 7. REWIND watermark (right side, aligned with caption)
    const filters = [
      'crop=min(iw\\,ih):min(iw\\,ih)',
      'scale=540:540',
      'pad=620:740:40:50:white',
      'drawbox=x=250:y=15:w=20:h=10:color=0xFF6B6B:t=fill',
      'drawbox=x=270:y=15:w=20:h=10:color=0xFFA500:t=fill',
      'drawbox=x=290:y=15:w=20:h=10:color=0xFFD93D:t=fill',
      'drawbox=x=310:y=15:w=20:h=10:color=0x6BCB77:t=fill',
      'drawbox=x=330:y=15:w=20:h=10:color=0x4D96FF:t=fill',
      'drawbox=x=350:y=15:w=20:h=10:color=0x9D84B7:t=fill',
    ];

    // Date text (left side, below image - handwriting style)
    filters.push(
      `drawtext=text='${dateStr}':fontfile='${fontRegular}':fontsize=28:fontcolor=0x333333:x=50:y=610`
    );

    // Caption text (left side, below date - larger handwriting)
    if (safeCaption) {
      filters.push(
        `drawtext=text='${safeCaption}':fontfile='${fontRegular}':fontsize=36:fontcolor=0x333333:x=50:y=660`
      );
    }

    // REWIND watermark (right side, aligned with caption area)
    filters.push(
      `drawtext=text='REWIND':fontfile='${fontBold}':fontsize=28:fontcolor=0x333333:x=w-text_w-50:y=700`
    );

    const filterStr = filters.join(',');

    // FFmpeg command: apply filters, re-encode with H.264, limit to 6 seconds
    const command = `ffmpeg -i "${inputPath}" -vf "${filterStr}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -t 6 -movflags +faststart -y "${outputPath}"`;

    console.log('🎬 Running FFmpeg polaroid compositing...');
    const { stderr } = await execAsync(command, { timeout: 30000 });

    // Read the processed video
    const processedBuffer = await readFile(outputPath);
    console.log(`✅ Polaroid video created: ${Math.round(processedBuffer.length / 1024)}KB`);

    return processedBuffer;
  } catch (error) {
    console.error('❌ FFmpeg video processing failed:', error.message);
    throw new Error(`Video processing failed: ${error.message}`);
  } finally {
    // Clean up temp files
    if (tempDir) {
      try {
        const { rm } = await import('fs/promises');
        await rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Check if FFmpeg is available on the system
 * @returns {Promise<boolean>}
 */
export async function checkFFmpegAvailable() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

export default {
  createPolaroidVideo,
  checkFFmpegAvailable,
};
