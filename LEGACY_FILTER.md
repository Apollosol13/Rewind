# 🏛️ Legacy Filter - Old Money Aesthetic

## Overview
The **Legacy** filter replaces the Noir filter and delivers a sophisticated **Old Money / Country Estate** aesthetic with warm, muted tones and refined elegance.

## 🎨 Visual Characteristics

### Exact Settings (User-Specified):
```
Exposure:    -53  (darker, moodier)
Contrast:    -41  (soft, gentle)
Shadow:      -19  (lifted blacks, softer shadows)
Brightness:  -21  (reduced brightness)
Saturation:  -7   (slightly muted)
Warmth:      +42  (golden amber tone)
```

### Technical Translation:
```typescript
{
  brightness: 0.68,      // Combined exposure & brightness reduction
  contrast: 0.59,        // Soft, reduced contrast
  saturation: 0.93,      // Slightly desaturated
  temperature: 42,       // Warm golden/amber tones
  fade: 0.19,           // Lifted shadows (softer blacks)
  grain: 0.08,          // Subtle film texture
  vignette: 0.12,       // Gentle edge darkening
}
```

## 📊 What It Looks Like

### Color Palette:
- **Warm amber/golden** undertones
- **Muted greens** and earth tones
- **Soft beiges** and creams
- **Refined navy** and deep colors
- **Reduced saturation** for sophistication

### Mood:
- ☀️ **Ralph Lauren catalog** aesthetic
- 🏰 **Country estate** photography
- ⛵ **Yacht club / Newport** vibes
- 📚 **Ivy League / Preppy** elegance
- 🎞️ **Timeless film** quality

### Best For:
- Outdoor garden/estate photos
- Fashion and lifestyle shots
- Architecture and interiors
- Portraits with warm lighting
- Product photography (luxury goods)

## 🔧 Implementation Details

### Filter ID: `legacy`
- Replaces: `noir` (Film Noir B&W)
- Icon: 🏛️ `building.columns.fill`
- Color: `#C9A66B` (Old gold)
- Era: "Timeless"

### Color Matrix:
```typescript
colorMatrix: [
  0.95, 0.05, 0.05, 0, -10,  // Warm color shift
  0.05, 0.95, 0.05, 0, -8,   // Muted tones
  0.05, 0.05, 0.90, 0, -5,   // Reduced blues
  0, 0, 0, 1, 0
]
```

### Overlay (Approximation):
```typescript
// Dark layer for exposure/brightness reduction
backgroundColor: 'rgba(0, 0, 0, 0.25)'

// Warm amber glow for +42 warmth
backgroundColor: 'rgba(255, 200, 120, 0.18)'
```

## 📱 Current Implementation Status

### ✅ What's Working Now (Expo Go):
- **Filter selection** - Legacy appears in StyleDial
- **Visual overlay** - Color approximation applied
- **Camera preview** - See effect in real-time
- **Photo preview** - Filter visible before posting
- **Feed display** - Persists in posted photos

### ⚠️ Advanced Features (Require Native Build):
The **exact numerical settings** require `react-native-image-filter-kit`:
- Precise exposure adjustment
- Exact contrast reduction
- Saturation control
- Temperature shifting
- Shadow lifting

**To enable full precision:**
```bash
cd /Users/brennenstudenc/Desktop/Rewind/Rewind
eas build --profile development --platform ios
```

## 🎯 How It Compares

| Filter | Mood | Era | Best For |
|--------|------|-----|----------|
| **Legacy** | Sophisticated, Warm | Timeless | Lifestyle, fashion, estates |
| Polaroid | Nostalgic, Soft | 1970s-80s | Casual, instant moments |
| Vintage | Faded, Warm | 1960s-70s | Retro, nostalgic scenes |
| Sepia | Antique, Classic | 1900s-30s | Historical, aged look |
| Film | Natural, Rich | 1990s-00s | Everyday photography |
| Camcorder | VHS, Lo-fi | 1980s-90s | Party, candid videos |

## 🎨 Style Guide

### Recommended Subjects:
- ✅ Outdoor portraits in natural light
- ✅ Architecture (estates, mansions, universities)
- ✅ Fashion and lifestyle photography
- ✅ Garden and landscape scenes
- ✅ Interior design (libraries, living rooms)
- ✅ Product shots (luxury items, books, accessories)

### Avoid:
- ❌ Neon lights or bright artificial colors
- ❌ High-contrast urban scenes
- ❌ Super vibrant/saturated subjects
- ❌ Pure white backgrounds

### Lighting Tips:
- 🌅 Golden hour (sunrise/sunset)
- ☁️ Overcast/soft natural light
- 🕯️ Warm indoor lighting
- 🪟 Window light
- 🌳 Dappled shade

## 📖 References

- Filter definition: `src/utils/filterPresets.ts`
- Overlay effects: `src/components/FilterOverlay.tsx`
- Style selector: `src/components/StyleDial.tsx`
- Advanced processing: `src/utils/advancedFilters.ts`
- Filter utilities: `src/utils/polaroidFilter.ts`

## 🚀 Next Steps

### To Get Full Precision:
1. **Build with EAS** (enables native modules)
2. **Test in TestFlight** (or development build)
3. **Fine-tune settings** if needed

### Optional Enhancements:
- Add subtle film grain texture
- Implement gentle vignette gradient
- Create preset variations ("Legacy Warm", "Legacy Cool")
- Add user-adjustable intensity slider

---

**The Legacy filter brings timeless sophistication to every photo** 🏛️✨
