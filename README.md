# 🧰 Basic Dev Tools

A collection of lightweight, web-based developer utilities with a **clean GitHub-style interface**.

Modular design — new tools can be easily added.

---

## 🌐 Live Demo

[https://animesh2411.github.io/basic-dev-tools/](https://animesh2411.github.io/basic-dev-tools/)

---

## ⚙️ Tools Overview

| Tool                       | Icon | Description                                       | Notes                                                                                                             |
|----------------------------| ---- |---------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| URL Shortener              | 🔗   | Shorten long links using TinyURL API              | Real, shareable short links; input validation                                                                     |
| Polaroid Maker             | 📸   | Polaroid 4×6 Postcard Maker                       | Create printable 4×6 polaroid-style postcards — DPI control, fit modes, sharpening and captions. Exports JPG/PNG. |
| Vintage Polaroid Maker     | 📸   | Vintage Polaroid 4×6 Postcard Maker               | Create printable 4×6 vintage-style postcards — DPI control, fit modes, sharpening and captions. Exports JPG/PNG.  |
| Polaroid Camera            | 📸   | Polaroid 4×6 Postcard Camera                      | Click printable 4×6 polaroid-style postcards                                                                      |
| Base64 Encoder/Decoder     | 🧮   | Encode/decode text locally                        | Handles invalid Base64 gracefully; clear button                                                                   |
| QR Code Generator          | 📱   | Encode URLs or text into QR codes instantly       | Download generated QR as PNG                                                                                      |
| Cron Expression Reader     | ⏱️   | Read and edit cron schedule expressions           | Human-readable output; error validation                                                                           |
| AI Image Generator         | 🖼️  | Generate images from text prompts                 | Uses Pollinations API; responsive canvas; download PNG                                                            |
| Favicon / OG Image Fetcher | 🌐   | Fetch favicon, OG image, and page title from URL  | Fully client-side; preview website metadata                                                                       |
| Text Diff Tool             | 🔍   | Compare two text blocks → highlight differences   | Side-by-side input and output; inline char-level diff; mobile-friendly                                            |
| Image Resizer              | 📏   | Resize images by width/height or target file size | Fully client-side; preview & download; supports MB/px input                                                       |

---

## 🚀 Getting Started

1. **Open the homepage**:

Visit the live demo link above or host on GitHub Pages.

2. **Use the tools**:

* Click a tile to open the tool page.
* URL Shortener: paste a long URL → get a TinyURL link.
* Polaroid Maker: upload an image → Generate & Exports JPG/PNG.
* Vintage Polaroid Maker: upload an image → Generate & Exports JPG/PNG.
* Polaroid Camera: Click an image → Save as image.
* Base64 tool: encode/decode text.
* QR Code generator: enter URL/text → generate & download QR.
* Cron Reader: enter cron expression → read schedule.
* AI Image Generator: enter prompt → generate & download image.
* Favicon / OG Image Fetcher: enter website URL → fetch favicon, OG image, title.
* Text Diff Tool: paste original and modified text → highlight differences side-by-side.
* Image Resizer: upload an image → resize by width/height **OR** target size in MB → preview & download resized image.

---

## 💡 Adding New Tools

* Create a new HTML page and JS file for your tool.
* Add a new tile in the homepage pointing to the tool page.
* Add CSS to `style.css` or a new file if needed.

---

## 📐 Styling

* Clean, minimal GitHub-style theme.
* Responsive layout for desktop and mobile.
* Shared CSS for consistency across tool pages.

---

## 🔧 Dependencies

* Pure HTML, CSS, and JavaScript.
* No backend required except for URL Shortener (TinyURL API).
* Pollinations API is used for AI Image Generator (no key required, CORS-enabled).

---

## 📝 Future Improvements

* More developer tools (e.g., JSON Formatter, Color Picker, JWT Decoder).
* Analytics for URL shortener (requires API key).
* Dark mode toggle.
* Option to choose multiple shortener APIs (TinyURL, is.gd, Bitly).
* Loading animation for AI Image Generator to prevent rapid spamming.
* Optimized diff algorithm for Text Diff Tool for very large texts.
* Image Resizer: add drag & drop upload, multiple format support, and faster compression.

---

## 📜 License

MIT License © 2025 Basic Dev Tools
Made with ❤️ by Animesh

---
