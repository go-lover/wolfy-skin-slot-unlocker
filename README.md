# Wolfy Skin Slots Unlocker

A lightweight, robust client-side userscript for **[Wolfy.net](https://wolfy.net)** that unlocks all 6 skin slots, allowing you to manage and persist multiple custom character looks locally.

`wolfy-skin-slots-unlocker` hooks into the game's skin customization page and network layer, creating a fully integrated, multi-slot experience right inside your browser.

## Features

- **6 Fully Unlocked Slots:** Bypasses standard restrictions to provide access to all 6 skin slots directly in the UI.
- **Instant Hover Previews:** Displays real-time translucent SVG preview tooltips when hovering over any slot.
- **Local Persistence:** Automatically caches and manages individual skin configurations for each slot via `localStorage`.
- **Seamless API Interception:** Automatically intercepts and rewrites `fetch` and `XMLHttpRequest` calls to sync your active virtual slot with the Wolfy.net backend when you click **"Valider"**.
- **Page Caching:** Remembers your layout and rendered SVGs.

## Installation

To use this userscript, you need a userscript manager browser extension like **Tampermonkey** or **Violentmonkey**.

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) for your browser.
2. [Click here to install the script](https://github.com/go-lover/wolfy-skin-slots-unlocker/raw/main/wolfy-skin-slots-unlocker.user.js) *(or create a new script manually in your extension dashboard and paste the code).*
3. Navigate to **[Wolfy.net Skin Customization](https://wolfy.net/fr/skin)** and enjoy your unlocked slots.

## How It Works

1. **First-time Setup:** Navigate to your skin page, customize an item, and click **"Valider"** once. This registers your player's real slot UUID to the script.
2. **Switching Slots:** Click any of the 6 virtual slots on the custom bar. The script will dynamically swap states and sync the matching configuration.
3. **Saving Previews:** Whenever you modify your skin and click **"Valider"**, the script automatically caches the generated avatar SVG so you can preview it instantly later by hovering over the slot.

## Compatibility

- Works natively on all modern Chromium-based browsers (Chrome, Edge, Brave) and Firefox via Tampermonkey or Violentmonkey.
- Designed exclusively for `*://wolfy.net/*/skin*`.

## Disclaimer

This is an unofficial, client-side tool and is not affiliated with, sponsored by, or endorsed by Wolfy.net.
- Use this tool responsibly.
- **Use at your own risk.** Client-side modifications operate entirely within your browser environment.
