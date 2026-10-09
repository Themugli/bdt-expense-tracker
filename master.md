# Little Ledger - UI/UX Design System (Source of Truth)

## 1. Global Theme Rules
- **Mode:** Permanent Dark Mode strictly enforced. Light mode is disabled.
- **Aesthetic:** Apple-Tier Dark Mode (Absolute blacks, deep grays, frosted glass).
- **Shadows:** No drop shadows (`shadow-none`). Rely strictly on background elevation and thin borders for depth.

## 2. Color Palette (Strict Hex Enforcement)
- **Base Canvas (Level 0):** `bg-black` (`#000000`)
- **Surface Frame (Level 1):** `bg-[#0a0a0a]`
- **Inner Card (Level 2):** `bg-[#141416]` or `bg-[#1C1C1E]`
- **Borders:** `border-white/10` (or `border-[#2a2a2a]`)
- **Primary Accent:** Emerald Green (`bg-emerald-600` / `text-emerald-500`)
- **Primary Text:** `text-[#F5F5F7]`
- **Secondary/Muted Text:** `text-[#86868B]`

## 3. Typography
- **Font:** Inter (or system sans-serif).
- **Main Headers:** `font-extrabold tracking-tight`
- **Micro-labels:** `text-[10px] font-bold uppercase tracking-widest text-[#86868B]`

## 4. UI Component Architecture
### Nested Feature Cards (3-Layer Structure)
1. **Outer Frame:** `bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-10`
2. **Intermediate Tray:** `bg-[#141416]/90 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden`
3. **Inner Card:** `bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 relative z-10`
