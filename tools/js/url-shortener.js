async function shortenWithTinyURL(longUrl) {
  const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
  return await res.text();
}

document.getElementById("shortenBtn").addEventListener("click", async () => {
  const longUrl = document.getElementById("longUrl").value.trim();
  const output = document.getElementById("shortResult");

  if (!longUrl) {
    alert("Please enter a valid URL!");
    return;
  }

  output.style.display = "block";
  output.innerHTML = "Shortening...";

  try {
    const shortUrl = await shortenWithTinyURL(longUrl);
    output.innerHTML = `✅ Short URL: <a href="${shortUrl}" target="_blank">${shortUrl}</a>`;
  } catch (err) {
    output.innerHTML = "❌ Failed to shorten URL. Please try again.";
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("longUrl").value = "";
  document.getElementById("shortResult").style.display = "none";
});
