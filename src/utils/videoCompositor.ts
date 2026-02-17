import * as FileSystem from 'expo-file-system/legacy';

let FFmpegKit: any = null;
let ReturnCode: any = null;

// Lazy load FFmpeg (won't work in Expo Go, only in dev/production builds)
try {
  const ffmpeg = require('ffmpeg-kit-react-native');
  FFmpegKit = ffmpeg.FFmpegKit;
  ReturnCode = ffmpeg.ReturnCode;
} catch {
  console.log('FFmpeg not available (likely running in Expo Go)');
}

/**
 * Creates a polaroid-framed version of a video using FFmpeg.
 * Adds white padding (polaroid border), rainbow stripe, and date text.
 * Returns the local URI of the composited video, or null if FFmpeg is unavailable.
 */
export async function createPolaroidVideo(
  videoUri: string,
  caption?: string,
  date?: Date,
): Promise<string | null> {
  if (!FFmpegKit) {
    console.warn('FFmpeg not available — sharing raw video');
    return null;
  }

  try {
    const outputPath = `${FileSystem.cacheDirectory}rewind_polaroid_${Date.now()}.mp4`;
    const dateStr = (date || new Date()).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    // Build the FFmpeg filter chain for a polaroid look:
    // 1. Scale video to square (crop center)
    // 2. Add white padding (thick bottom for polaroid effect)
    // 3. Add rainbow stripe colored boxes at the top center
    // 4. Add date text at the bottom
    // 5. Add REWIND watermark
    const filters = [
      // Crop to square (center crop)
      'crop=min(iw\\,ih):min(iw\\,ih)',
      // Scale to 540x540
      'scale=540:540',
      // Pad with white: 40px sides, 50px top, 120px bottom (polaroid proportions)
      'pad=620:710:40:50:white',
      // Rainbow stripe (6 colored boxes at top center)
      'drawbox=x=250:y=15:w=20:h=10:color=0xFF6B6B:t=fill',
      'drawbox=x=270:y=15:w=20:h=10:color=0xFFA500:t=fill',
      'drawbox=x=290:y=15:w=20:h=10:color=0xFFD93D:t=fill',
      'drawbox=x=310:y=15:w=20:h=10:color=0x6BCB77:t=fill',
      'drawbox=x=330:y=15:w=20:h=10:color=0x4D96FF:t=fill',
      'drawbox=x=350:y=15:w=20:h=10:color=0x9D84B7:t=fill',
    ];

    const filterStr = filters.join(',');

    // FFmpeg command: apply filters, copy audio, limit to 6 seconds
    const command = `-i "${videoUri}" -vf "${filterStr}" -c:a copy -t 6 -y "${outputPath}"`;

    console.log('🎬 Running FFmpeg compositing...');
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      console.log('✅ Polaroid video created successfully');
      return outputPath;
    } else {
      const logs = await session.getAllLogsAsString();
      console.error('❌ FFmpeg failed:', logs);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating polaroid video:', error);
    return null;
  }
}

/**
 * Check if FFmpeg is available (not available in Expo Go)
 */
export function isFFmpegAvailable(): boolean {
  return FFmpegKit !== null;
}
