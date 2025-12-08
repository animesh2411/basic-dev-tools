// camera.js - mobile-friendly Polaroid camera
// expects: video#video, canvas#canvas, buttons with ids switchBtn, captureBtn, downloadLink, shareBtn, openNewTab, saveLastBtn
// and inputs dpi, fit, sharpen, caption
(() => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const switchBtn = document.getElementById('switchBtn');
  const captureBtn = document.getElementById('captureBtn');
  const downloadLink = document.getElementById('downloadLink');
  const openNewTab = document.getElementById('openNewTab');
  const shareBtn = document.getElementById('shareBtn');
  const saveLastBtn = document.getElementById('saveLastBtn');

  const dpiInput = document.getElementById('dpi');
  const fitSelect = document.getElementById('fit');
  const sharpenSelect = document.getElementById('sharpen');
  const captionInput = document.getElementById('caption');
  const infoText = document.getElementById('infoText');
  const galleryEl = document.getElementById('gallery');

  let mediaStream = null;
  let useFacingMode = 'environment'; // rear by default
  let lastDataUrl = null;
  const LOCAL_KEY = 'polaroid_cam_captures_v1'; // store data URLs (small set)

  // helpers
  function supports(constraint) {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaStreamTrack);
  }

  async function startCamera() {
    if (!supports()) {
      alert('getUserMedia not supported in this browser.');
      return;
    }
    if (mediaStream) {
      // stop previous tracks
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
    const constraints = {
      video: {
        facingMode: useFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = mediaStream;
      await video.play();
    } catch (err) {
      console.error('camera error', err);
      alert('Camera access denied or unavailable.');
    }
  }

  // Compose polaroid: given an ImageBitmap (or canvas), return canvas final sized to 4"x6" at dpi
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

  // progressive downscale copied (keeps quality)
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

  // simple sharpen (light)
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

  // capture frame from video -> return a canvas with raw capture
  function captureFromVideo() {
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const c = document.createElement('canvas');
    // keep same aspect ratio as video
    c.width = vW; c.height = vH;
    const cctx = c.getContext('2d');
    cctx.drawImage(video, 0, 0, vW, vH);
    return c;
  }

  // Compose final polaroid canvas and return blob (or dataURL)
  async function composePolaroid(sourceCanvas) {
    const dpi = Math.max(72, Math.min(1200, Number(dpiInput.value) || 300));
    const frame = computePolaroidFrame(4, 6, dpi);
    const photoW = frame.photoW, photoH = frame.photoH;

    // crop/fit logic (cover vs contain)
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
    } // contain leaves the whole image (will letterbox)

    // create crop canvas at full res
    const crop = document.createElement('canvas');
    crop.width = sW; crop.height = sH;
    const cctx = crop.getContext('2d');
    cctx.drawImage(sourceCanvas, sx, sy, sW, sH, 0, 0, sW, sH);

    // downscale/upscale to photo area
    const photoCanvas = progressiveDownscale(crop, photoW, photoH);

    // sharpen if requested
    const sharpen = sharpenSelect.value;
    if (sharpen !== 'none') applyUnsharpMask(photoCanvas, sharpen);

    // final canvas (4x6 at dpi)
    const final = document.createElement('canvas');
    final.width = frame.totalW; final.height = frame.totalH;
    const fctx = final.getContext('2d');

    // background
    fctx.fillStyle = '#fff'; fctx.fillRect(0, 0, final.width, final.height);

    // draw photo
    fctx.drawImage(photoCanvas, frame.marginLeft, frame.marginTop, frame.photoW, frame.photoH);

    // thin border
    fctx.strokeStyle = '#ededed'; fctx.lineWidth = Math.max(1, Math.round(dpi * 0.003));
    fctx.strokeRect(frame.marginLeft - 1, frame.marginTop - 1, frame.photoW + 2, frame.photoH + 2);

    // caption
    const caption = (captionInput.value || '').trim();
    if (caption) {
      fctx.fillStyle = '#222';
      const fontSize = Math.round(dpi * 0.06);
      fctx.font = `${fontSize}px sans-serif`;
      fctx.textAlign = 'center';
      const captionY = Math.round(frame.marginTop + frame.photoH + frame.marginBottom * 0.55);
      fctx.fillText(caption, final.width / 2, captionY);
    }

    // return blob
    return new Promise((res) => {
      final.toBlob((blob) => {
        res({ blob, canvas: final });
      }, 'image/jpeg', 0.95);
    });
  }

  // Save blob to local download link (user action) and add to local gallery
  async function savePolaroid(blob, canvasEl) {
    // create object URL and set as download link
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    const filename = `polaroid_${Date.now()}.jpg`;
    downloadLink.download = filename;

    // open popup for direct view
    openNewTab.onclick = () => { window.open(url, '_blank'); };

    // store data URL for in-app gallery (read blob to dataURL)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      // store in localStorage (keep only last 20)
      const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      arr.unshift({ id: Date.now(), dataUrl, filename });
      while (arr.length > 20) arr.pop();
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
      renderGallery();
      lastDataUrl = dataUrl;
      updatePreviewCanvas(canvasEl);
      // revoke URL after some time
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    };
    reader.readAsDataURL(blob);
  }

  function updatePreviewCanvas(finalCanvas) {
    // show a downscaled preview (responsive)
    const maxW = 900;
    let scale = 1;
    if (finalCanvas.width > maxW) scale = maxW / finalCanvas.width;
    canvas.width = Math.round(finalCanvas.width * scale);
    canvas.height = Math.round(finalCanvas.height * scale);
    const cctx = canvas.getContext('2d');
    cctx.clearRect(0, 0, canvas.width, canvas.height);
    cctx.drawImage(finalCanvas, 0, 0, canvas.width, canvas.height);
    infoText.textContent = `${finalCanvas.width}×${finalCanvas.height}px • ${dpiInput.value} DPI`;
  }

  // load gallery from localStorage
  function renderGallery() {
    const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    galleryEl.innerHTML = '';
    if (!arr.length) {
      galleryEl.innerHTML = '<div class="small muted">No captures yet</div>';
      return;
    }
    arr.forEach(item => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      const img = document.createElement('img');
      img.src = item.dataUrl;
      img.alt = 'capture';
      const lbl = document.createElement('small');
      const d = new Date(item.id);
      lbl.textContent = d.toLocaleString();
      tile.appendChild(img);
      tile.appendChild(lbl);
      tile.onclick = () => {
        // open full-size in new tab
        const w = window.open('', '_blank');
        const html = `<title>Polaroid</title><img src="${item.dataUrl}" style="max-width:100%;height:auto">`;
        w.document.write(html);
        w.document.close();
      };
      galleryEl.appendChild(tile);
    });
  }

  // attempt to share using Web Share API (mobile)
  async function tryShare(blob) {
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'polaroid.jpg', { type: blob.type })] })) {
      try {
        await navigator.share({
          files: [new File([blob], 'polaroid.jpg', { type: blob.type })],
          title: 'Polaroid capture',
        });
        return true;
      } catch (e) {
        console.warn('share failed', e);
        return false;
      }
    } else if (navigator.share) {
      // fallback: share a URL (not ideal). Convert to dataURL may be large.
      try {
        const dataUrl = await new Promise(res => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(blob);
        });
        await navigator.share({ title: 'Polaroid', text: 'Polaroid capture', url: dataUrl });
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  // INIT
  async function init() {
    renderGallery();
    await startCamera();

    // wire buttons
    switchBtn.onclick = async () => {
      useFacingMode = (useFacingMode === 'environment') ? 'user' : 'environment';
      await startCamera();
    };

    captureBtn.onclick = async () => {
      // capture raw frame
      const raw = captureFromVideo();
      // compose polaroid (blob + canvas)
      const { blob, canvas: finalCanvas } = await composePolaroid(raw);
      // update preview and save to local gallery
      await savePolaroid(blob, finalCanvas);
      // optionally auto-download: trigger click on download link to prompt save
      // NOTE: auto-click is allowed only when triggered by user gesture (captureBtn click qualifies)
      downloadLink.click();
    };

    shareBtn.onclick = async () => {
      // share the most recent from localStorage if present
      const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      if (!arr.length) { alert('No captures yet'); return; }
      const first = arr[0];
      // convert dataURL to blob
      const res = await fetch(first.dataUrl);
      const blob = await res.blob();
      const ok = await tryShare(blob);
      if (!ok) alert('Share not supported or failed on this device.');
    };

    saveLastBtn.onclick = () => {
      // trigger download for last captured (if available)
      if (downloadLink.href) downloadLink.click();
      else alert('No capture ready to save yet.');
    };

    openNewTab.onclick = () => {
      if (downloadLink.href) window.open(downloadLink.href, '_blank');
      else alert('No capture to open yet.');
    };

    // also render preview if user edits caption / options
    [dpiInput, fitSelect, sharpenSelect, captionInput].forEach(el => {
      el.addEventListener('change', () => {
        // no auto re-compose from camera; users must capture again to get new settings
      });
    });

    // try to enable torch (if supported)
    try {
      const [track] = (await navigator.mediaDevices.getUserMedia({ video: { facingMode: useFacingMode } })).getVideoTracks();
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        // optional: add UI and implement if needed
      }
      track.stop();
    } catch (e) {
      // ignore
    }
  }

  // run
  init();

})();
