/**
 * Video compositing is now handled server-side on the Railway backend.
 * The backend uses FFmpeg to create polaroid-framed videos.
 * 
 * See: backend/src/services/videoProcessor.js
 * API: POST /api/photos/process-video
 * Client helper: src/services/backendApi.ts -> processVideoPolaroid()
 */

export function isFFmpegAvailable(): boolean {
  return false;
}
