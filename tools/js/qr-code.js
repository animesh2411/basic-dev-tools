let qrCodeInstance;

const qrContainer = document.getElementById("qrcode");
const downloadBtn = document.getElementById("downloadBtn");

document.getElementById("generateBtn").addEventListener("click", () => {
  const text = document.getElementById("qrText").value.trim();

  if (!text) {
    alert("Please enter text or URL!");
    return;
  }

  // Clear previous QR code
  qrContainer.innerHTML = "";

  // Generate new QR code
  qrCodeInstance = new QRCode(qrContainer, {
    text: text,
    width: 200,
    height: 200,
    colorDark: "#24292e",
    colorLight: "#f6f8fa",
    correctLevel: QRCode.CorrectLevel.H
  });

  // Enable download button
  downloadBtn.disabled = false;
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!qrContainer.querySelector("img")) return;

  const qrImg = qrContainer.querySelector("img").src;

  const link = document.createElement("a");
  link.href = qrImg;
  link.download = "qr-code.png";
  link.click();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("qrText").value = "";
  qrContainer.innerHTML = "";
  downloadBtn.disabled = true;
});
