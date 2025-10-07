document.getElementById("encodeBtn").addEventListener("click", () => {
  const input = document.getElementById("textInput").value.trim();
  const output = document.getElementById("outputBox");

  if (!input) {
    alert("Please enter text to encode!");
    return;
  }

  const encoded = btoa(unescape(encodeURIComponent(input)));
  output.style.display = "block";
  output.innerText = encoded;
});

document.getElementById("decodeBtn").addEventListener("click", () => {
  const input = document.getElementById("textInput").value.trim();
  const output = document.getElementById("outputBox");

  if (!input) {
    alert("Please enter Base64 text to decode!");
    return;
  }

  try {
    const decoded = decodeURIComponent(escape(atob(input)));
    output.style.display = "block";
    output.innerText = decoded;
  } catch (e) {
    output.style.display = "block";
    output.innerText = "❌ Invalid Base64 input!";
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("textInput").value = "";
  document.getElementById("outputBox").style.display = "none";
});
