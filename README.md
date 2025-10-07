# 🧰 Basic Dev Tools

A collection of lightweight, web-based developer utilities with a clean GitHub-style interface.

Currently, includes:

1. **URL Shortener** — Shortens long URLs using the TinyURL API.
2. **Base64 Encoder/Decoder** — Encode and decode text to/from Base64.
3. **QR Code Generator** — Generate a QR code for your links.
4. **Cron Expression Reader** — Read and edit cron schedule expressions.

Designed to be modular — new tools can be easily added.

---

## 🌐 Live Demo

[https://animesh2411.github.io/basic-dev-tools/](https://animesh2411.github.io/basic-dev-tools/)

---

## 📂 Folder Structure

```
basic-dev-tools/
│
├── index.html                # Homepage with tiles for all tools
├── css/
│   └── main.css              # Homepage styling
├── js/
│   └── main.js               # Homepage JS (tile hover animations)
│
└── tools/
    ├── url-shortener.html    # URL Shortener page
    ├── base64-tool.html      # Base64 Encoder/Decoder page
    │
    ├── css/
    │   └── style.css         # Shared tool page styling
    │
    └── js/
        ├── url-shortener.js  # JS for URL Shortener
        └── base64-tool.js    # JS for Base64 tool
```

---

## ⚙️ Features

### Homepage

* Tiles for each tool with hover animation.
* Clean, responsive GitHub-style UI.

### URL Shortener

* Uses **TinyURL API** for real, shareable short links.
* Input validation and instant output display.

### Base64 Encoder/Decoder

* Encode and decode text locally.
* Input validation and error handling for invalid Base64.
* Clear button to reset input/output.

---

## 🚀 Getting Started

1. **Clone the repository**:

```bash
git clone https://github.com/animesh2411/basic-dev-tools.git
```

2. **Open the homepage**:

Open `index.html` in your browser, or host on GitHub Pages.

3. **Use the tools**:

* Click a tile to open the tool page.
* URL Shortener: paste a long URL → get a TinyURL link.
* Base64 tool: paste text → encode/decode.

---

## 💡 Adding New Tools

1. Create a new HTML file in `/tools/`.
2. Create a corresponding JS file in `/tools/js/`.
3. Add shared CSS in `/tools/css/style.css` or a new CSS file.
4. Add a new tile in `index.html` pointing to the tool page.

---

## 📐 Styling

* Clean, minimal GitHub-style theme.
* Responsive layout for desktop and mobile.
* Shared CSS for consistency across tool pages.

---

## 🔧 Dependencies

* Pure HTML, CSS, and JavaScript.
* No backend required except for URL Shortener (TinyURL API).

---

## 📝 Future Improvements

* More developer tools (e.g., JSON Formatter, Color Picker, JWT Decoder).
* Analytics for URL shortener (requires API key).
* Dark mode toggle.
* Option to choose multiple shortener APIs (TinyURL, is.gd, Bitly).

---

## 📜 License

MIT License © 2025 Animesh Gupta

---
