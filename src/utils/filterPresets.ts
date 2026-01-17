/**
 * Authentic Time-Period Filter Presets
 * 
 * Each filter is designed to replicate the photographic/video technology
 * and aesthetic of its respective era.
 */

export interface FilterPreset {
  id: string;
  name: string;
  era: string;
  characteristics: {
    colorMatrix?: number[]; // 4x5 color transformation matrix
    brightness?: number;    // 0.0 - 2.0 (1.0 = normal)
    contrast?: number;      // 0.0 - 2.0 (1.0 = normal)
    saturation?: number;    // 0.0 - 2.0 (1.0 = normal)
    temperature?: number;   // -100 to 100 (0 = neutral, positive = warm, negative = cool)
    grain?: number;         // 0.0 - 1.0 (film grain/noise)
    vignette?: number;      // 0.0 - 1.0 (darkened corners)
    fade?: number;          // 0.0 - 1.0 (lifted blacks/faded look)
    // Advanced settings
    highlights?: number;    // 0.0 - 1.0 (highlight control)
    blackPoint?: number;    // 0.0 - 1.0 (black point adjustment)
    vibrance?: number;      // 0.0 - 1.0 (selective saturation)
    tint?: number;          // 0.0 - 1.0 (color tint)
    sharpness?: number;     // 0.0 - 1.0 (edge sharpening)
    definition?: number;    // 0.0 - 1.0 (local contrast)
    brilliance?: number;    // 0.0 - 1.0 (highlight brightness)
  };
  description: string;
}

export const FILTER_PRESETS: Record<string, FilterPreset> = {
  /**
   * POLAROID (1970s-1980s)
   * Vintage Polaroid instant film characteristics
   */
  polaroid: {
    id: 'polaroid',
    name: 'Polaroid',
    era: '1970s-1980s',
    characteristics: {
      colorMatrix: [
        1.05, 0.02, 0.02, 0, 8,   // Warm color shift
        0.02, 1.03, 0.02, 0, 5,   // Slight green adjustment
        0.02, 0.02, 1.0, 0, 3,    // Balanced blues
        0, 0, 0, 1, 0
      ],
      brightness: 0.81,       // Combined exposure (-24) & brightness (+5)
      contrast: 0.57,         // Reduced contrast (-43)
      saturation: 0.83,       // Desaturated (-17)
      temperature: 20,        // Warm tone (+20)
      grain: 0.25,            // Noise reduction inverted
      vignette: 0.51,         // Strong vignette (-51 = more darkening)
      fade: 0.77,             // Lifted shadows (+77)
      // Additional advanced settings
      highlights: 0.22,       // Reduced highlights (+22)
      blackPoint: 0.41,       // Lifted blacks (-41)
      vibrance: 0.45,         // Enhanced vibrance (+45)
      tint: 0.29,             // Color tint (+29)
      sharpness: 0.16,        // Slight sharpening (+16)
      definition: 0.29,       // Enhanced definition (+29)
      brilliance: 0.38,       // Increased brilliance (+38)
    },
    description: 'Authentic vintage Polaroid instant film with warm tones, lifted shadows, strong vignette, and that classic soft Polaroid aesthetic',
  },

  /**
   * VINTAGE (1960s-1970s)
   * Kodachrome/Ektachrome slide film: faded colors, warm nostalgic glow
   */
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    era: '1960s-1970s',
    characteristics: {
      colorMatrix: [
        1.2, 0.1, 0.05, 0, 20,  // Heavy red/warm boost
        0.05, 1.0, 0.05, 0, 10, // Keep greens natural
        0.05, 0.05, 0.8, 0, 0,  // Reduce blues significantly
        0, 0, 0, 1, 0
      ],
      brightness: 1.08,
      contrast: 0.75,
      saturation: 1.25,
      temperature: 25,
      grain: 0.25,
      vignette: 0.3,
      fade: 0.25,
    },
    description: 'Nostalgic 60s-70s look with faded colors, reduced contrast, and warm orange-red tones like aged Kodachrome slides',
  },

  /**
   * SEPIA (1900s-1930s)
   * Early photography: brown-tone monochrome, aged paper look
   */
  sepia: {
    id: 'sepia',
    name: 'Sepia',
    era: '1900s-1930s',
    characteristics: {
      colorMatrix: [
        0.393, 0.769, 0.189, 0, 0, // Convert to grayscale
        0.349, 0.686, 0.168, 0, 0, // with sepia tone
        0.272, 0.534, 0.131, 0, 0, // (brown monochrome)
        0, 0, 0, 1, 0
      ],
      brightness: 1.05,
      contrast: 0.9,
      saturation: 0.0,
      temperature: 35,
      grain: 0.35,
      vignette: 0.4,
      fade: 0.2,
    },
    description: 'Classic early 1900s aged photograph with brown-tone monochrome, mimicking oxidized silver prints',
  },

  /**
   * LEGACY (Timeless Old Money)
   * Sophisticated estate photography: warm, muted, refined elegance
   */
  legacy: {
    id: 'legacy',
    name: 'Legacy',
    era: 'Timeless',
    characteristics: {
      colorMatrix: [
        0.95, 0.05, 0.05, 0, -10,  // Warm color shift
        0.05, 0.95, 0.05, 0, -8,   // Muted tones
        0.05, 0.05, 0.90, 0, -5,   // Reduced blues
        0, 0, 0, 1, 0
      ],
      brightness: 0.68,      // Combined exposure (-53) & brightness (-21)
      contrast: 0.59,        // Reduced contrast (-41)
      saturation: 0.93,      // Slightly desaturated (-7)
      temperature: 42,       // Warm amber/golden tone (+42)
      grain: 0.08,          // Subtle film-like texture
      vignette: 0.12,       // Gentle edge darkening
      fade: 0.19,           // Lifted shadows (-19)
    },
    description: 'Timeless old money aesthetic with warm muted tones, soft contrast, and sophisticated refinement - like vintage Ralph Lauren catalogs',
  },

  /**
   * B&W (Black & White)
   * Clean black & white filter with balanced contrast
   */
  film: {
    id: 'film',
    name: 'B&W',
    era: 'Timeless',
    characteristics: {
      colorMatrix: [
        0.5, 0.0, 0.0, 0, -50,   // Exposure -50
        0.0, 0.5, 0.0, 0, -50,
        0.0, 0.0, 0.5, 0, -50,
        0, 0, 0, 1, 0
      ],
      brightness: 0.90,       // Brightness -10
      contrast: 1.10,         // Contrast +10
      saturation: 0.0,        // Saturation -100 (pure B&W)
      temperature: -50,       // Warmth -50 (cool tone)
      grain: 0.15,
      vignette: 0.08,
      fade: 0.05,
      // Advanced B&W settings
      highlights: 0.0,        // Highlights -100 (blown out)
      brilliance: 1.25,       // Brilliance +25 (enhanced brightness in highlights)
    },
    description: 'Clean black & white filter with balanced contrast, blown highlights, and cool tone - timeless monochrome photography',
  },

  /**
   * CAMCORDER (1980s-1990s)
   * VHS/Hi8 camcorder: scan lines, color bleeding, tape artifacts
   */
  camcorder: {
    id: 'camcorder',
    name: 'Camcorder',
    era: '1980s-1990s',
    characteristics: {
      colorMatrix: [
        1.0, 0.1, 0.1, 0, 10,   // Color bleeding between channels
        0.1, 1.0, 0.1, 0, 10,   // (chroma subsampling artifacts)
        0.1, 0.1, 1.0, 0, 10,
        0, 0, 0, 1, 0
      ],
      brightness: 0.5,        // -50 brightness
      contrast: 0.85,
      saturation: 0.69,       // -31 saturation
      temperature: 29,        // +29 warmth
      grain: 0.3,
      vignette: 0.15,
      fade: 0.1,
      // Advanced VHS-specific settings
      highlights: 0.0,        // -100 highlights (blown out)
      vibrance: 0.18,         // +18 vibrance
      tint: 0.18,             // +18 tint
      sharpness: 1.0,         // +100 sharpness (oversharpened VHS look)
    },
    description: '1980s-90s VHS camcorder aesthetic with blown highlights, oversharpened edges, reduced saturation, and that distinctive home video look',
  },
};

/**
 * Get filter preset by ID
 */
export function getFilterPreset(filterId: string): FilterPreset | undefined {
  return FILTER_PRESETS[filterId];
}

/**
 * Apply a filter preset to an image
 * Uses expo-image-manipulator for basic adjustments
 * Advanced color matrix transformations require react-native-image-filter-kit
 */
export async function applyFilter(imageUri: string, filterId: string): Promise<string> {
  const preset = getFilterPreset(filterId);
  
  if (!preset) {
    console.warn(`Filter preset "${filterId}" not found`);
    return imageUri;
  }

  console.log(`Applying filter: ${preset.name} (${preset.era})`);
  
  try {
    // Import dynamically to avoid issues
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    
    // Apply basic image adjustments based on filter preset
    const manipulations: any[] = [];
    
    // Different filters need different processing
    switch (filterId) {
      case 'polaroid':
        // Warm, soft, slightly faded
        // Expo-image-manipulator doesn't support brightness/contrast directly
        // These effects are approximated through compression and will be enhanced with filter-kit
        break;
        
      case 'vintage':
        // Faded, warm colors
        break;
        
      case 'sepia':
        // Sepia tone applied via filter-kit color matrix
        break;
        
      case 'legacy':
        // Warm, muted, sophisticated old money aesthetic
        break;
        
      case 'film':
        // Natural film look with subtle grain
        break;
        
      case 'camcorder':
        // VHS effect with oversaturation
        // Lower quality to simulate VHS degradation
        break;
    }
    
    // Apply manipulations
    const result = await manipulateAsync(
      imageUri,
      manipulations,
      { 
        compress: filterId === 'camcorder' ? 0.75 : 0.9, // VHS has lower quality
        format: SaveFormat.JPEG 
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error(`Error applying filter ${filterId}:`, error);
    return imageUri;
  }
}

/**
 * Check if a filter should show overlay elements (like REC indicator)
 */
export function shouldShowFilterOverlay(filterId: string): boolean {
  return filterId === 'camcorder';
}

/**
 * Get overlay configuration for a filter
 */
export function getFilterOverlay(filterId: string) {
  if (filterId === 'camcorder') {
    return {
      showREC: true,
      showTimestamp: true,
      showBattery: true,
      showCorners: true,
      showScanlines: true,
    };
  }
  return null;
}
