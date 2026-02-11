# Rewind Filter Guide

Authentic time-period filters that replicate the photographic and video technology of different eras.

---

## 📸 Filter Overview

### 1. **Polaroid** (1970s-1980s)
**Era:** Instant Film Photography  
**Technology:** Polaroid SX-70, 600, Spectra cameras  

**Visual Characteristics:**
- ☀️ Warm, slightly overexposed look
- 🌅 Soft focus with dreamy quality
- 🎨 Muted but warm colors (reds/oranges boosted)
- 📉 Reduced contrast (lifted blacks)
- ✨ Slight grain and vignetting
- 🔆 Bright midtones

**Color Science:**
- Temperature: +15 (warm)
- Contrast: 0.85 (soft)
- Saturation: 1.15 (enhanced)
- Fade: 0.15 (lifted blacks)

---

### 2. **Vintage** (1960s-1970s)
**Era:** Golden Age of Color Film  
**Technology:** Kodachrome, Ektachrome slide film  

**Visual Characteristics:**
- 🌅 Heavy warm tones (orange/red shift)
- 📉 Very reduced contrast (faded look)
- 🎨 Oversaturated in warm colors, desaturated cool colors
- 🔶 Orange/yellow cast overall
- 📸 Nostalgic "grandmother's photo album" feel
- 🌫️ Significant fade (lifted shadows)

**Color Science:**
- Temperature: +25 (very warm)
- Contrast: 0.75 (very soft)
- Saturation: 1.25 (boosted)
- Blues reduced by 20%

**Instagram Equivalent:** Similar to "Clarendon" or "Juno" filters

---

### 3. **Sepia** (1900s-1930s)
**Era:** Early Photography  
**Technology:** Silver gelatin prints, aged albumen prints  

**Visual Characteristics:**
- 🟤 Brown-tone monochrome (no color)
- 📜 Aged paper appearance
- 🌫️ Heavy vignetting (darkened edges)
- ✨ Strong grain/texture
- 🎞️ Historical, archival feel
- 📉 Slight contrast reduction

**Color Science:**
- Full desaturation with sepia tone matrix
- Contrast: 0.9
- Grain: 0.35 (high)
- Vignette: 0.4 (strong)

---

### 4. **Noir** (1940s-1950s)
**Era:** Film Noir Cinema  
**Technology:** Black & white film, dramatic lighting  

**Visual Characteristics:**
- ⚫⚪ Pure black & white (no color)
- 📈 HIGH contrast (crushed blacks, blown highlights)
- 🌑 Dramatic shadows
- 💡 Strong highlights
- 🎬 Cinematic, moody atmosphere
- 🌫️ Heavy vignetting

**Color Science:**
- Full grayscale conversion
- Contrast: 1.4 (very high)
- Vignette: 0.5 (heavy)
- No fade (pure blacks)

**Reference:** Think classic detective movies, "Citizen Kane," "The Maltese Falcon"

---

### 5. **Film** (1990s-2000s)
**Era:** Modern Film Photography  
**Technology:** Fuji Superia, Kodak Portra, Kodak Gold  

**Visual Characteristics:**
- 🎨 Natural, rich colors
- 🌈 Slight color enhancement
- ✨ Fine, subtle grain
- 📊 Balanced contrast
- 🎯 Accurate color reproduction
- 🌟 Slight warmth

**Color Science:**
- Temperature: +5 (slightly warm)
- Contrast: 1.1 (enhanced)
- Saturation: 1.1 (natural boost)
- Grain: 0.1 (subtle)

**Reference:** Instagram's "Lark" or professional film scans

---

### 6. **Camcorder** ⭐ NEW (1980s-1990s)
**Era:** Home Video Revolution  
**Technology:** VHS, Hi8, Video8 camcorders  

**Visual Characteristics:**
- 📼 VHS tape artifacts
- 📺 Horizontal scan lines
- 🌈 Color bleeding/chroma noise
- 🎨 Oversaturated, especially reds
- ⚡ Slight blur (low resolution)
- 📉 Reduced contrast
- ✨ Video noise/grain
- 🎥 "Home movie" aesthetic

**Color Science:**
- Temperature: -5 (slightly cool, tube TV look)
- Contrast: 0.85 (soft)
- Saturation: 1.3 (boosted, especially reds)
- Grain: 0.3 (video noise)
- Color bleeding between RGB channels

**Visual Effects to Add:**
- Horizontal scan lines (optional)
- VHS tracking lines at edges
- Date/time stamp overlay (optional)
- REC indicator (optional)

**Reference:** Old home videos, "REC" indicator, that distinctive 80s-90s home video quality

---

## 🎨 Implementation Notes

### Current Status:
✅ Filter options added to StyleDial  
✅ Filter presets documented in `filterPresets.ts`  
✅ Time-period characteristics defined  
⏳ Visual effects not yet applied (requires filter library)  

### To Implement Full Visual Effects:

1. **Install Filter Library:**
```bash
npm install react-native-image-filter-kit
npx expo prebuild
```

2. **Apply Filters:**
Use the presets in `src/utils/filterPresets.ts` to configure each filter's color matrix, brightness, contrast, etc.

3. **Additional Effects:**
- Scan lines for camcorder
- Vignetting for all filters
- Film grain texture overlay
- Color bleeding simulation

---

## 📱 User Experience

**In Camera:**
- Tap filter dial to preview each style
- See filter name and era displayed
- Real-time preview (when filters implemented)

**Filter Names on Photos:**
- Each photo remembers which filter was used
- Maintains authentic aesthetic for each era

---

## 🎯 Design Philosophy

Each filter is designed to be **historically accurate** rather than just "pretty." Users should feel transported to that specific time period when viewing their photos.

- **Polaroid:** Feel like finding an old instant photo in a drawer
- **Vintage:** Like flipping through a 1960s family album
- **Sepia:** Museum-quality archival photography
- **Noir:** Classic Hollywood cinema
- **Film:** Professional film photography
- **Camcorder:** Dad's home videos from the 90s 📼
