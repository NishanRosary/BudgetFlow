# BudgetFlow Design System

## 🎨 Color Palette (Finance SaaS Theme)

| Color Role | Value | Description |
|------------|-------|-------------|
| **Primary** | `#0f766e` (Teal 700) | Deep, trustworthy finance green/teal |
| **Secondary** | `#0ea5e9` (Sky 500) | Modern blue for accents |
| **Accent Gradient** | `linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%)` | Used for Hero text and primary buttons |
| **Background** | `#f8fafc` (Slate 50) | clean, professional light gray |
| **Card Bg** | `#ffffff` (White) | Pure white for cards |
| **Text Primary** | `#0f172a` (Slate 900) | High contrast dark slate for headings |
| **Text Secondary** | `#64748b` (Slate 500) | Soft gray for subtext |
| **Success** | `#10b981` (Emerald 500) | For Income/Positive balance |
| **Danger** | `#ef4444` (Red 500) | For Expenses/Negative actions |

## 🔤 Typography

**Font Family**: `Poppins` (Headings) + `Inter` (Body)

| Usage | Font | Weight | Size (Desktop) |
|-------|------|--------|----------------|
| **Hero Title** | Poppins | Bold (700) | `3.5rem` |
| **Section Title** | Poppins | SemiBold (600) | `2rem` |
| **Card Title** | Poppins | Medium (500) | `1.125rem` |
| **Body Text** | Inter | Regular (400) | `1rem` |
| **Small Text** | Inter | Medium (500) | `0.875rem` |

## 🧩 Components

### Buttons
- **Shape**: Rounded Pill (`border-radius: 50px`)
- **Primary**: Gradient background, white text, soft shadow (`0 4px 6px -1px rgba(15, 118, 110, 0.2)`)
- **Hover**: Lift effect (`transform: translateY(-2px)`)

### Cards
- **Border Radius**: `24px`
- **Shadow**: Soft, diffused (`0 10px 15px -3px rgba(0, 0, 0, 0.05)`)
- **Border**: Subtle (`1px solid #e2e8f0`)
- **Hover**: Lift effect + stronger shadow

### Icons
- **Style**: Minimal outline or duotone
- **Container**: Soft rounded square with gradient background opacity

## 📐 Layout
- **Container Max Width**: `1280px`
- **Spacing**: Generous white space (4rem+ between sections)
- **Grid**: Responsive styling (1 col mobile, 2 tablet, 3/4 desktop)
