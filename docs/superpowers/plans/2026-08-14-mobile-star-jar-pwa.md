# 手机情绪星星瓶 PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the star jar as an installable, offline-capable mobile PWA with a dynamic bottle-led interface.

**Architecture:** Retain the localStorage star data model while replacing the page shell with mobile-first HTML/CSS/JS. A manifest and service worker add installability and offline caching without any backend.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Web App Manifest, Service Worker, localStorage.

## Global Constraints

- Keep data local under `emotion-star-jar:v1` and preserve existing valid entries.
- No external assets, accounts, server, analytics, or libraries.
- The 375px first viewport exposes the bottle, status and a single clear create action.
- Support keyboard use and `prefers-reduced-motion`.

---

### Task 1: Replace the layout with a mobile-first dynamic app shell

**Files:**
- Modify: `C:\Users\CHAO\Desktop\web\index.html`

- [ ] Build a dark night-sky app shell with a large interactive glass bottle, compact top status, and `#create-star` as a fixed floating action button.
- [ ] Move reason input and color choices into a bottom-sheet dialog; render pending and resolved entries in a second swipe-like bottom sheet with tabs.
- [ ] Keep the existing IDs and local star functions so create, resolution and history remain usable.
- [ ] Verify at 375px that no desktop side-by-side layout remains, the bottle is visible without scrolling, and keyboard focus is visible.

### Task 2: Add mobile motion and interaction polish

**Files:**
- Modify: `C:\Users\CHAO\Desktop\web\index.html`

- [ ] Add low-amplitude star float animation, a bottle glow responsive to pending count, and create/resolve transitions.
- [ ] Respect reduced-motion by disabling animation and transition effects.
- [ ] Verify adding one star, opening it, resolving it, and refreshing preserves data and shows the resolved archive.

### Task 3: Add install and offline support

**Files:**
- Create: `C:\Users\CHAO\Desktop\web\manifest.webmanifest`
- Create: `C:\Users\CHAO\Desktop\web\sw.js`
- Modify: `C:\Users\CHAO\Desktop\web\index.html`

- [ ] Add manifest metadata, local SVG/PNG icons, standalone display mode and theme colors.
- [ ] Register a service worker only on supported HTTP/HTTPS origins; cache `index.html`, manifest and local image assets.
- [ ] Verify the manifest parses as JSON, JavaScript syntax is valid, and file-preview mode still works without service-worker registration.
