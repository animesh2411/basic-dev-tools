const qrCanvas = document.getElementById("qrcodeCanvas");
const qrCtx = qrCanvas.getContext("2d");
const originalTextDiv = document.getElementById("originalText");
const downloadBtn = document.getElementById("downloadBtn");

// Utility: Wrap text on canvas with character-level wrapping, line spacing, and dynamic font size
function wrapTextDynamic(ctx, text, x, y, maxWidth, maxHeight, initialFontSize) {
  let fontSize = initialFontSize;
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  let lineHeight = fontSize + 12;

  while (fontSize > 12) {
    let lines = [];
    let line = '';
    for (let i = 0; i < text.length; i++) {
      line += text[i];
      if (ctx.measureText(line).width > maxWidth) {
        lines.push(line.slice(0, -1));
        line = text[i];
      }
    }
    if (line) lines.push(line);

    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= maxHeight) {
      // Draw each line
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      lines.forEach((l, index) => ctx.fillText(l, x, y + index * lineHeight));
      return totalHeight;
    }
    fontSize -= 2;
    lineHeight = fontSize + 12;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  }

  // Draw at minimum font size if still too big
  let lines = [];
  let line = '';
  for (let i = 0; i < text.length; i++) {
    line += text[i];
    if (ctx.measureText(line).width > maxWidth) {
      lines.push(line.slice(0, -1));
      line = text[i];
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, index) => ctx.fillText(l, x, y + index * lineHeight));
  return lines.length * lineHeight;
}

document.getElementById("generateBtn").addEventListener("click", () => {
  const text = document.getElementById("qrText").value.trim();
  if (!text) {
    alert("Please enter text or URL!");
    return;
  }

  qrCanvas.width = 1080;
  qrCanvas.height = 1920;

  qrCtx.fillStyle = "#f6f8fa";
  qrCtx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);

  const topMargin = 100;       // distance from top to URL/text
  const spacingBelowText = 40; // spacing between text and QR code
  const footerHeight = 60 + 32;
  const maxTextWidth = qrCanvas.width - 100;

  // Generate QR code in a temporary div
  const tempDiv = document.createElement("div");
  const qrCode = new QRCode(tempDiv, {
    text: text,
    width: 800,
    height: 800,
    colorDark: "#24292e",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  const qrImg = tempDiv.querySelector("img");
  qrImg.onload = () => {
    qrCtx.textAlign = "center";
    qrCtx.fillStyle = "#24292e";

    // Draw URL/text at top
    const textHeight = wrapTextDynamic(qrCtx, text, qrCanvas.width / 2, topMargin, maxTextWidth, 500, 40);

    // Determine QR size based on remaining space
    const availableHeightForQR = qrCanvas.height - topMargin - textHeight - spacingBelowText - footerHeight;
    const qrSize = Math.min(800, availableHeightForQR);

    // Draw QR code below text
    const qrX = (qrCanvas.width - qrSize) / 2;
    const qrY = topMargin + textHeight + spacingBelowText;
    qrCtx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Draw footer
    qrCtx.font = "32px Inter, sans-serif";
    qrCtx.fillText("Made with ❤️ by Animesh & © 2025 Basic Dev Tools", qrCanvas.width / 2, qrCanvas.height - 60);
  };

  // HTML preview below canvas
  originalTextDiv.style.marginTop = "40px";
  originalTextDiv.innerText = text;

  downloadBtn.disabled = false;
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "qr-code.png";
  link.href = qrCanvas.toDataURL("image/png");
  link.click();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("qrText").value = "";
  qrCtx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
  originalTextDiv.innerText = "";
  downloadBtn.disabled = true;
});
