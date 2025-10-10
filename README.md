Here’s an **updated version of your README** reflecting all the new tools you’ve added, including the QR code generator, Cron reader, and AI image generator, plus some small improvements for clarity and consistency:

---

# 🧰 Basic Dev Tools

A collection of lightweight, web-based developer utilities with a **clean GitHub-style interface**.

Modular design — new tools can be easily added.

---

## 🌐 Live Demo

[https://animesh2411.github.io/basic-dev-tools/](https://animesh2411.github.io/basic-dev-tools/)

---

## 📂 Folder Structure

```
basic-dev-tools/
│
├── index.html                  # Homepage with tiles for all tools
├── css/
│   └── main.css                # Homepage styling
├── js/
│   └── main.js                 # Homepage JS (tile hover animations)
│
└── tools/
    ├── url-shortener.html      # URL Shortener page
    ├── base64-tool.html        # Base64 Encoder/Decoder page
    ├── qr-code.html            # QR Code Generator page
    ├── cron-reader.html        # Cron Expression Reader page
    ├── image-generator.html    # AI Image Generator page
    │
    ├── css/
    │   └── style.css           # Shared tool page styling
    │   └── image-generator.css # Styling for AI Image Generator
    │
    └── js/
        ├── url-shortener.js    # JS for URL Shortener
        ├── base64-tool.js      # JS for Base64 tool
        ├── qr-code.js          # JS for QR Code Generator
        ├── cron-reader.js      # JS for Cron Expression Reader
        └── image-generator.js  # JS for AI Image Generator
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

### QR Code Generator

* Generate a QR code from any text or URL.
* Dynamically wraps long URLs.
* Download generated QR code as PNG.

### Cron Expression Reader

* Enter any cron expression and see human-readable description.
* Validates expression and displays errors if invalid.

### AI Image Generator

* Generate images from text prompts using **Pollinations API** (no API key, no backend required).
* Responsive canvas with prompt displayed at top and footer.
* Download generated image as PNG.

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
* Base64 tool: encode/decode text.
* QR Code generator: enter URL/text → generate & download QR.
* Cron Reader: enter cron expression → read schedule.
* AI Image Generator: enter prompt → generate & download image.

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
* Pollinations API is used for AI Image Generator (no key required, CORS-enabled).

---

## 📝 Future Improvements

* More developer tools (e.g., JSON Formatter, Color Picker, JWT Decoder).
* Analytics for URL shortener (requires API key).
* Dark mode toggle.
* Option to choose multiple shortener APIs (TinyURL, is.gd, Bitly).
* Loading animation for AI Image Generator to prevent rapid spamming.

---

## 📜 License

MIT License © © 2025 Basic Dev Tools
Made with ❤️ by Animesh

---
