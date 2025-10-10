const canvas = document.getElementById("aiCanvas");
const ctx = canvas.getContext("2d");
const promptInput = document.getElementById("promptText");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const originalTextDiv = document.getElementById("originalText");
const downloadBtn = document.getElementById("downloadBtn");

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
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      lines.forEach((l, index) => ctx.fillText(l, x, y + index * lineHeight));
      return totalHeight;
    }
    fontSize -= 2;
    lineHeight = fontSize + 12;
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  }

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

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Please enter a prompt!");
    return;
  }

  canvas.width = 1080;
  canvas.height = 1920;
  ctx.fillStyle = "#f6f8fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  originalTextDiv.innerText = prompt;
  ctx.textAlign = "center";
  ctx.fillStyle = "#24292e";

  const topMargin = 100;
  const footerHeight = 60 + 32;
  const maxTextWidth = canvas.width - 100;
  const textHeight = wrapTextDynamic(ctx, prompt, canvas.width / 2, topMargin, maxTextWidth, 500, 40);

  const spacingBelowText = 40;
  const availableHeight = canvas.height - topMargin - textHeight - spacingBelowText - footerHeight;
  const imageSize = Math.min(800, availableHeight);

  ctx.fillText("Generating image...", canvas.width / 2, topMargin + textHeight + spacingBelowText);

  try {
    const response = await fetch("https://api.craiyon.com/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error("Failed to generate image");

    const data = await response.json();
    const firstImage = data.images[0];
    const imageUrl = `data:image/png;base64,${firstImage}`;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const imgX = (canvas.width - imageSize) / 2;
      const imgY = topMargin + textHeight + spacingBelowText;
      ctx.drawImage(img, imgX, imgY, imageSize, imageSize);

      ctx.font = "32px Inter, sans-serif";
      ctx.fillText("Made with ❤️ by Animesh & © 2025 Basic Dev Tools", canvas.width / 2, canvas.height - 60);
    };

    downloadBtn.disabled = false;
    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.download = "ai-image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

  } catch (err) {
    console.error(err);
    ctx.fillText("❌ Error generating image. Please try again.", canvas.width/2, topMargin + textHeight + spacingBelowText);
  }
});

clearBtn.addEventListener("click", () => {
  promptInput.value = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  originalTextDiv.innerText = "";
  downloadBtn.disabled = true;
});
