# Nexus Override Sequence - UI/UX Guidelines

## 1. Core Identity & Vibe
* **Theme:** Dark mode, cyberpunk, tactical sci-fi HUD.
* **Borders:** Sharp corners, thin neon borders (`border-[#FFAB00]/20` to `border-[#FFAB00]`), often using left-border accents (`border-l-[6px] border-[#FFAB00]`).
* **Shadows:** Extensive use of inset shadows and drop shadows using primary orange colors (e.g., `shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]`, `shadow-[0_0_30px_rgba(255,171,0,0.2)]`).
* **Backgrounds:** Deep dark blues and blacks (`#000000`, `#030303`, `#0F1A24`). Use linear gradients and `backdrop-blur-md` for glass effects.

## 2. Color Palette
* **Base/Background:** `#000000` (Pure Black), `#030303`, `#0F1A24` (Dark Blue/Grey).
* **Primary Accents (Amber/Orange):** * Glow/Bright: `#FFD54F`, `#FFAB00`
    * Mid/Main: `#FF6D00`
    * Dark/Deep: `#E65100`, `#5C3A0B`
* **Text:** `#ffffff` (White), `text-orange-50`.

## 3. Typography
* **Headings:** 'Plus Jakarta Sans' or 'Rajdhani'. Must be `uppercase`, `tracking-widest` (or `tracking-tight` for massive hero text), and `font-medium`.
* **Body/Labels/Badges:** 'Geist' or 'JetBrains Mono'. Must be `font-mono`, `text-xs` or `text-[10px]`, `uppercase`, and `tracking-widest`. 

## 4. Custom CSS Classes (Must Be Preserved)
* `.text-metallic`: A complex linear gradient clip for hero text.
* `.glow-card`: A flashlight mouse-tracking effect utilizing `--mouse-x` and `--mouse-y` variables.
* `.reveal`: Base class for IntersectionObserver scroll animations.

## 5. UI Components
* **Buttons:** Rectangular, background `#1A2A3A]/40`, border `white/5`, backdrop blur. Hover state includes left/right expanding neon brackets (`w-[4px]` to `w-[8px] bg-white`).
* **Badges:** Inline flex, `bg-[#5C3A0B]/30`, border `#FFAB00]/20`, monospace text.
* **Icons:** Use Iconify (`solar` or `lucide` sets), usually colored `#FFAB00` or `#FF6D00`.