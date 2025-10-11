// client-side only solution using public image endpoints/fallbacks
const input = document.getElementById("urlInput");
const fetchBtn = document.getElementById("fetchBtn");
const clearBtn = document.getElementById("clearBtn");
const resultBox = document.getElementById("result");
const faviconImg = document.getElementById("faviconImg");
const previewImg = document.getElementById("previewImg");
const siteTitle = document.getElementById("siteTitle");
const copyFaviconBtn = document.getElementById("copyFaviconUrl");
const copyPageBtn = document.getElementById("copyPageUrl");
const openPreviewBtn = document.getElementById("openPreview");
const visitLink = document.getElementById("visitLink");
const note = document.getElementById("note");

function normalizeUrl(raw) {
  if (!raw) return null;
  let url = raw.trim();
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
    url = "http://" + url;
  }
  try {
    const u = new URL(url);
    return u;
  } catch (e) {
    return null;
  }
}

function tryFaviconCandidates(origin, domain) {
  // candidate 1: <origin>/favicon.ico
  const c1 = origin.replace(/\/$/, "") + "/favicon.ico";
  // candidate 2: Google favicon service
  const c2 = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  return [c1, c2];
}

function setImageWithFallback(imgEl, urls, onSuccess, onFail) {
  // try list of URLs in order until one loads
  let i = 0;
  function tryOne() {
    if (i >= urls.length) {
      if (onFail) onFail();
      return;
    }
    const url = urls[i++];
    imgEl.onload = () => {
      imgEl.src = url; // ensure src remains
      if (onSuccess) onSuccess(url);
    };
    imgEl.onerror = () => {
      // try next
      tryOne();
    };
    // start loading
    imgEl.src = url;
  }
  tryOne();
}

function setPreviewImage(url) {
  // use WordPress mShots service to get screenshot (no key)
  // docs: https://developer.wordpress.com/docs/mshots/
  // mShots URL format: https://s.wordpress.com/mshots/v1/{url}?w=600
  const shotUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=800`;
  previewImg.onload = () => {
    // ok
  };
  previewImg.onerror = () => {
    // fallback: try simply the site root as image (unlikely), or hide
    previewImg.style.display = "none";
  };
  previewImg.src = shotUrl;
  previewImg.style.display = "block";
  openPreviewBtn.onclick = () => window.open(shotUrl, "_blank");
}

fetchBtn.addEventListener("click", () => {
  const raw = input.value;
  const u = normalizeUrl(raw);
  if (!u) {
    alert("Please enter a valid URL (e.g., https://example.com)");
    return;
  }

  // show result box
  resultBox.style.display = "block";

  // Basic title fallback (domain)
  siteTitle.textContent = u.hostname;

  // visit link
  visitLink.href = u.href;

  // set preview screenshot
  setPreviewImage(u.href);

  // try favicon candidates
  const candidates = tryFaviconCandidates(u.origin, u.hostname);
  setImageWithFallback(faviconImg, candidates, (usedUrl) => {
    // success - usedUrl available
    copyFaviconBtn.onclick = () => {
      navigator.clipboard && navigator.clipboard.writeText(usedUrl);
      copyFaviconBtn.textContent = "Copied!";
      setTimeout(() => (copyFaviconBtn.textContent = "Copy favicon URL"), 1500);
    };
  }, () => {
    // both failed — hide favicon
    faviconImg.style.display = "none";
  });

  // copy page URL
  copyPageBtn.onclick = () => {
    navigator.clipboard && navigator.clipboard.writeText(u.href);
    copyPageBtn.textContent = "Copied!";
    setTimeout(() => (copyPageBtn.textContent = "Copy page URL"), 1500);
  };

  // note about OG parsing
  note.innerHTML = "Note: to obtain exact OG title/description/meta you need server-side fetching (CORS prevents reading arbitrary page HTML from the browser). " +
    "If you want that, deploy a tiny serverless function that fetches and returns parsed metadata.";
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  resultBox.style.display = "none";
  faviconImg.src = "";
  previewImg.src = "";
  previewImg.style.display = "none";
  faviconImg.style.display = "inline-block";
  siteTitle.textContent = "—";
});
