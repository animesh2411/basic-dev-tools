// camera.js — polished camera UI logic (mobile-first)
// Requires: elements in index.html (video, buttons, canvas, inputs, gallery container)

(() => {
  const video = document.getElementById('video');
  const focusRing = document.getElementById('focusRing');
  const flashBtn = document.getElementById('flashBtn');
  const ratioBtn = document.getElementById('ratioBtn');
  const timerBtn = document.getElementById('timerBtn');
  const switchBtn = document.getElementById('switchBtn');
  const captureBtn = document.getElementById('captureBtn');
  const downloadLink = document.getElementById('downloadLink');
  const openNewTab = document.getElementById('openNewTab');
  const shareBtn = document.getElementById('shareBtn');
  const saveLastBtn = document.getElementById('saveLastBtn');
  const galleryThumb = document.getElementById('galleryThumb');
  const thumbImg = document.getElementById('thumbImg');
  const dpiInput = document.getElementById('dpi');
  const fitSelect = document.getElementById('fit');
  const sharpenSelect = document.getElementById('sharpen');
  const captionInput = document.getElementById('caption');
  const infoText = document.getElementById('infoText') || { textContent: '' };
  const galleryEl = document.getElementById('gallery');
  const canvas = document.getElementById('canvas');

  let mediaStream = null;
  let useFacingMode = 'environment';
  let lastDataUrl = null;
  const LOCAL_KEY = 'polaroid_cam_captures_v1';
  let timerSeconds = 0;

  /* UTILITIES (kept compact) */
  const supports = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  function computePolaroidFrame(widthIn = 4, heightIn = 6, dpi = 300) {
    const totalW = Math.round(widthIn * dpi);
    const totalH = Math.round(heightIn * dpi);
    const marginLeft = Math.round(0.18 * dpi);
    const marginRight = marginLeft;
    const marginTop = Math.round(0.18 * dpi);
    const marginBottom = Math.round(0.48 * dpi);
    const photoW = totalW - marginLeft - marginRight;
    const photoH = totalH - marginTop - marginBottom;
    return { totalW, totalH, marginLeft, marginRight, marginTop, marginBottom, photoW, photoH };
  }

  async function startCamera() {
    if (!supports()) { alert('Camera not supported'); return; }
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    const constraints = { video: { facingMode: useFacingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false };
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = mediaStream;
      await video.play();
    } catch (err) {
      console.error(err); alert('Camera access denied or unavailable.');
    }
  }

  function captureFromVideo() {
    const vW = video.videoWidth, vH = video.videoHeight;
    const c = document.createElement('canvas');
    c.width = vW; c.height = vH;
    c.getContext('2d').drawImage(video, 0, 0, vW, vH);
    return c;
  }

  // progressive downscale (same as before)
  function progressiveDownscale(sourceCanvas, targetW, targetH) {
    let current = sourceCanvas;
    if (current.width < targetW || current.height < targetH) {
      const out = document.createElement('canvas');
      out.width = targetW; out.height = targetH;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      octx.drawImage(current, 0, 0, current.width, current.height, 0, 0, targetW, targetH);
      return out;
    }
    while (current.width / 2 >= targetW && current.height / 2 >= targetH) {
      const half = document.createElement('canvas');
      half.width = Math.max(1, Math.floor(current.width / 2));
      half.height = Math.max(1, Math.floor(current.height / 2));
      const hctx = half.getContext('2d');
      hctx.imageSmoothingEnabled = true; hctx.imageSmoothingQuality = 'high';
      hctx.drawImage(current, 0, 0, current.width, current.height, 0, 0, half.width, half.height);
      current = half;
    }
    const final = document.createElement('canvas');
    final.width = targetW; final.height = targetH;
    const fctx = final.getContext('2d');
    fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality = 'high';
    fctx.drawImage(current, 0, 0, current.width, current.height, 0, 0, targetW, targetH);
    return final;
  }

  function applyUnsharpMask(canvasEl, strength = 'mild') {
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width, h = canvasEl.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const radius = strength === 'strong' ? 2 : 1;
    const amount = strength === 'strong' ? 1.2 : 0.6;
    const tmp = document.createElement('canvas');
    tmp.width = Math.max(1, Math.floor(w / (radius + 1)));
    tmp.height = Math.max(1, Math.floor(h / (radius + 1)));
    const tctx = tmp.getContext('2d');
    tctx.imageSmoothingEnabled = true; tctx.imageSmoothingQuality = 'high';
    tctx.drawImage(canvasEl, 0, 0, w, h, 0, 0, tmp.width, tmp.height);
    const t2 = document.createElement('canvas'); t2.width = w; t2.height = h;
    const t2ctx = t2.getContext('2d');
    t2ctx.imageSmoothingEnabled = true; t2ctx.imageSmoothingQuality = 'high';
    t2ctx.drawImage(tmp, 0, 0, tmp.width, tmp.height, 0, 0, w, h);
    const blurData = t2ctx.getImageData(0, 0, w, h).data;
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const orig = data[i + c];
        const blurred = blurData[i + c];
        let val = orig + amount * (orig - blurred);
        if (val < 0) val = 0; if (val > 255) val = 255;
        data[i + c] = val;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  async function composePolaroid(sourceCanvas) {
    const dpi = Math.max(72, Math.min(1200, Number(dpiInput.value) || 300));
    const frame = computePolaroidFrame(4, 6, dpi);
    const photoW = frame.photoW, photoH = frame.photoH;

    const srcW = sourceCanvas.width, srcH = sourceCanvas.height;
    const srcAspect = srcW / srcH;
    const targetAspect = photoW / photoH;

    let sx = 0, sy = 0, sW = srcW, sH = srcH;
    if (fitSelect.value === 'cover') {
      if (srcAspect > targetAspect) {
        sW = Math.round(srcH * targetAspect);
        sx = Math.round((srcW - sW) / 2);
      } else {
        sH = Math.round(srcW / targetAspect);
        sy = Math.round((srcH - sH) / 2);
      }
    }

    const crop = document.createElement('canvas');
    crop.width = sW; crop.height = sH;
    crop.getContext('2d').drawImage(sourceCanvas, sx, sy, sW, sH, 0, 0, sW, sH);

    const photoCanvas = progressiveDownscale(crop, photoW, photoH);

    if (sharpenSelect.value !== 'none') applyUnsharpMask(photoCanvas, sharpenSelect.value);

    const final = document.createElement('canvas');
    final.width = frame.totalW; final.height = frame.totalH;
    const fctx = final.getContext('2d');

    fctx.fillStyle = '#fff'; fctx.fillRect(0, 0, final.width, final.height);
    fctx.drawImage(photoCanvas, frame.marginLeft, frame.marginTop, frame.photoW, frame.photoH);
    fctx.strokeStyle = '#ededed'; fctx.lineWidth = Math.max(1, Math.round(frame.totalW * 0.003));
    fctx.strokeRect(frame.marginLeft - 1, frame.marginTop - 1, frame.photoW + 2, frame.photoH + 2);

    const caption = (captionInput.value || '').trim();
    if (caption) {
      fctx.fillStyle = '#222';
      const fontSize = Math.round(frame.totalW * 0.06 / 4); // scaled for canvas width
      fctx.font = `${fontSize}px sans-serif`;
      fctx.textAlign = 'center';
      const captionY = Math.round(frame.marginTop + frame.photoH + frame.marginBottom * 0.55);
      fctx.fillText(caption, final.width / 2, captionY);
    }

    return new Promise((res) => {
      final.toBlob((blob) => res({ blob, canvas: final }), 'image/jpeg', 0.95);
    });
  }

  async function savePolaroid(blob, canvasEl) {
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    const filename = `polaroid_${Date.now()}.jpg`;
    downloadLink.download = filename;
    openNewTab.onclick = () => window.open(url, '_blank');

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      arr.unshift({ id: Date.now(), dataUrl, filename });
      while (arr.length > 30) arr.pop();
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
      renderGallery();
      lastDataUrl = dataUrl;
      updatePreviewCanvas(canvasEl);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    };
    reader.readAsDataURL(blob);
  }

  function updatePreviewCanvas(finalCanvas) {
    const maxW = 900;
    let scale = 1; if (finalCanvas.width > maxW) scale = maxW / finalCanvas.width;
    canvas.width = Math.round(finalCanvas.width * scale); canvas.height = Math.round(finalCanvas.height * scale);
    const cctx = canvas.getContext('2d'); cctx.clearRect(0, 0, canvas.width, canvas.height); cctx.drawImage(finalCanvas, 0, 0, canvas.width, canvas.height);
    // set thumbnail
    try {
      thumbImg.src = lastDataUrl || canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) { /* ignore */ }
  }

  function renderGallery() {
    const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    galleryEl.innerHTML = '';
    if (!arr.length) { galleryEl.innerHTML = '<div class="small muted">No captures yet</div>'; return; }
    arr.forEach(item => {
      const tile = document.createElement('div'); tile.className = 'tile';
      const img = document.createElement('img'); img.src = item.dataUrl; img.alt = 'capture';
      const lbl = document.createElement('small'); lbl.textContent = new Date(item.id).toLocaleString();
      tile.append(img, lbl);
      tile.onclick = () => {
        const w = window.open('', '_blank');
        w.document.write(`<title>Polaroid</title><img src="${item.dataUrl}" style="max-width:100%;height:auto">`);
        w.document.close();
      };
      galleryEl.appendChild(tile);
    });
  }

  async function tryShare(blob) {
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'polaroid.jpg', { type: blob.type })] })) {
      try { await navigator.share({ files: [new File([blob], 'polaroid.jpg', { type: blob.type })], title: 'Polaroid capture' }); return true; } catch (e) { return false; }
    } else if (navigator.share) {
      try {
        const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
        await navigator.share({ title: 'Polaroid', text: 'Polaroid capture', url: dataUrl }); return true;
      } catch (e) { return false; }
    }
    return false;
  }

  /* UI helpers */
  function flashToggle() {
    const pressed = flashBtn.getAttribute('aria-pressed') === 'true';
    flashBtn.setAttribute('aria-pressed', String(!pressed));
    flashBtn.textContent = !pressed ? '⚡️' : '⚡';
  }

  function showFocus(x, y) {
    if (!focusRing) return;
    focusRing.style.left = `${x - 40}px`;
    focusRing.style.top = `${y - 40}px`;
    focusRing.style.opacity = '1';
    focusRing.style.transform = 'scale(1)';
    setTimeout(() => { focusRing.style.opacity = '0'; focusRing.style.transform = 'scale(0.6)'; }, 900);
  }

  /* wiring */
  async function init() {
    renderGallery();
    await startCamera();

    // tap-to-focus (visual only)
    video.addEventListener('click', (ev) => {
      const r = video.getBoundingClientRect();
      const x = ev.clientX - r.left; const y = ev.clientY - r.top; showFocus(x, y);
    });

    flashBtn.onclick = () => flashToggle();
    ratioBtn.onclick = () => {
      ratioBtn.textContent = ratioBtn.textContent === '4:6' ? '1:1' : '4:6';
      // changing ratio only toggles UI label — capture uses polaroid 4x6 always (adjust if you want)
    };
    timerBtn.onclick = () => {
      timerSeconds = timerSeconds === 0 ? 3 : 0;
      timerBtn.textContent = timerSeconds === 0 ? '⏱️' : `⏱️ ${timerSeconds}s`;
    };

    switchBtn.onclick = async () => {
      useFacingMode = useFacingMode === 'environment' ? 'user' : 'environment';
      await startCamera();
    };

    captureBtn.onclick = async (ev) => {
      // allow timer
      if (timerSeconds > 0) {
        captureBtn.disabled = true;
        let t = timerSeconds;
        captureBtn.querySelector('.inner')?.classList.add('counting');
        const interval = setInterval(() => {
          captureBtn.querySelector('.inner').textContent = t; t--; if (t < 0) { clearInterval(interval); captureBtn.querySelector('.inner').textContent = ''; captureBtn.disabled = false; } }, 1000);
        await new Promise(res => setTimeout(res, timerSeconds * 1000));
      }
      // capture
      const raw = captureFromVideo();
      const { blob, canvas: finalCanvas } = await composePolaroid(raw);
      await savePolaroid(blob, finalCanvas);
      // trigger download (user gesture)
      downloadLink.click();
    };

    galleryThumb.onclick = () => {
      document.getElementById('controlsPanel').classList.toggle('open');
    };

    shareBtn.onclick = async () => {
      const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      if (!arr.length) { alert('No captures yet'); return; }
      const blob = await (await fetch(arr[0].dataUrl)).blob();
      const ok = await tryShare(blob);
      if (!ok) alert('Share not supported or failed on this device.');
    };

    saveLastBtn.onclick = () => {
      if (downloadLink.href) downloadLink.click();
      else alert('No capture ready to save yet.');
    };

    openNewTab.onclick = () => {
      if (downloadLink.href) window.open(downloadLink.href, '_blank');
      else alert('No capture to open yet.');
    };

    // live thumbnail update (on load)
    setInterval(() => {
      const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      if (arr.length && (!thumbImg.src || thumbImg.src === '')) {
        thumbImg.src = arr[0].dataUrl;
      }
    }, 1000);
  }

  init();

})();
