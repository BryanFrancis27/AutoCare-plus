# AutoCare+  
## Color Branding Specification

---

## 1. Branding Overview

The visual identity of **AutoCare+** follows a **clean, modern, and subtly vibrant design approach** using **black, red, and white** as the core color palette. This combination reflects:

- **Black:** Strength, reliability, professionalism  
- **Red:** Energy, urgency, alerts, and automotive identity  
- **White:** Clarity, simplicity, and readability  

The design prioritizes **usability and focus**, ensuring that red is used **sparingly and intentionally** to avoid visual fatigue.

---

## 2. Core Color Palette

### 2.1 Primary Colors

| Color Name | Hex Code | Usage |
|-----------|---------|------|
| Primary Black | `#0F0F0F` | Main backgrounds, headers, navigation |
| Primary Red | `#D32F2F` | Call-to-action, alerts, highlights |
| Pure White | `#FFFFFF` | Backgrounds, text contrast |

---

### 2.2 Supporting Shades

| Color Name | Hex Code | Usage |
|-----------|---------|------|
| Soft Black | `#1A1A1A` | Card backgrounds, sections |
| Muted Red | `#E53935` | Hover states, secondary highlights |
| Light Gray | `#F5F5F5` | Page backgrounds |
| Border Gray | `#E0E0E0` | Dividers, outlines |

> **Design Principle:**  
> Use **white and light gray** for breathing space, **black** for structure, and **red** only for emphasis.

---

## 3. Color Usage Guidelines

### 3.1 Backgrounds
- Use **white or light gray** as the default page background.
- Use **primary black** for:
  - Navigation bars
  - Sidebars
  - Page headers
- Avoid large red backgrounds to prevent visual overload.

---

### 3.2 Typography

| Element | Color |
|-------|------|
| Primary text | `#0F0F0F` |
| Secondary text | `#4A4A4A` |
| Inverse text (on dark backgrounds) | `#FFFFFF` |
| Highlight text | `#D32F2F` |

> Red should never be used for long paragraphs.

---

### 3.3 Buttons and Call-to-Action (CTA)

#### Primary Button
- Background: `#D32F2F`
- Text: `#FFFFFF`
- Hover: `#B71C1C`

#### Secondary Button
- Background: Transparent
- Border: `#D32F2F`
- Text: `#D32F2F`
- Hover: Light red tint (`#FDEAEA`)

---

### 3.4 Alerts and Status Indicators

| Status | Color |
|------|------|
| Success | Dark gray with check icon |
| Warning / Upcoming Maintenance | `#E53935` |
| Critical / Overdue | `#B71C1C` |
| Info | Neutral gray |

> Red is reserved for **time-sensitive or important actions**.

---

## 4. Component-Level Guidelines

### 4.1 Cards
- Background: White
- Border: Light gray
- Accent (optional): Thin red top border or icon

---

### 4.2 Forms
- Input background: White
- Border: Light gray
- Focus state: Red outline or underline
- Error state: Red text + border

---

### 4.3 Dashboard Highlights
- Use red **only** for:
  - Upcoming maintenance counts
  - Overdue alerts
  - Primary actions
- Use black and gray for all other statistics.

---

## 5. Icons and Visual Accents

- Default icon color: Dark gray
- Active or alert icons: Red
- Avoid multi-colored icons to maintain brand consistency

---

## 6. Accessibility Guidelines

- Maintain a **minimum contrast ratio of 4.5:1**
- Ensure text remains readable on black backgrounds
- Avoid red-only indicators; always pair with text or icons

---

## 7. Tailwind CSS Implementation (Recommended)

```ts
// tailwind.config.js
colors: {
  blackPrimary: '#0F0F0F',
  blackSoft: '#1A1A1A',
  redPrimary: '#D32F2F',
  redMuted: '#E53935',
  whitePure: '#FFFFFF',
  grayLight: '#F5F5F5',
  grayBorder: '#E0E0E0',
}
