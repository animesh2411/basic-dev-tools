// polaroid-script.js - main app logic (works with polaroid-filters.js)
(function(){
  // DOM
  const fileInput = document.getElementById('file');
  const generateBtn = document.getElementById('generate');
  const generatePlainBtn = document.getElementById('generatePlain');
  const canvasEl = document.getElementById('canvas');
  const ctx = canvasEl.getContext && canvasEl.getContext('2d');
  const dpiInput = document.getElementById('dpi');
  const fitSelect = document.getElementById('fit');
  const sharpenSelect = document.getElementById('sharpen');
  const captionInput = document.getElementById('caption');
  const infoText = document.getElementById('infoText');
  const downloadLink = document.getElementById('downloadLink');
  const openNewTab = document.getElementById('openNewTab');
  const galleryEl = document.getElementById('gallery');

  const LOCAL_KEY = 'polaroid_vintage_caps';

  let currentImage = null;

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

  // progressive downscale helper (keeps quality)
  function progressiveDownscale(sourceCanvas, targetW, targetH) {
    let current = sourceCanvas;
    if (current.width < targetW || current.height < targetH) {
      const out = document.createElement('canvas'); out.width=targetW; out.height=targetH;
      const octx = out.getContext('2d'); octx.imageSmoothingEnabled=true; octx.imageSmoothingQuality='high';
      octx.drawImage(current,0,0,current.width,current.height,0,0,targetW,targetH);
      return out;
    }
    while (current.width / 2 >= targetW && current.height / 2 >= targetH) {
      const half = document.createElement('canvas');
      half.width = Math.max(1, Math.floor(current.width/2));
      half.height = Math.max(1, Math.floor(current.height/2));
      const hctx = half.getContext('2d');
      hctx.imageSmoothingEnabled = true; hctx.imageSmoothingQuality='high';
      hctx.drawImage(current,0,0,current.width,current.height,0,0,half.width,half.height);
      current = half;
    }
    const final = document.createElement('canvas'); final.width=targetW; final.height=targetH;
    const fctx = final.getContext('2d'); fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality='high';
    fctx.drawImage(current,0,0,current.width,current.height,0,0,targetW,targetH);
    return final;
  }

  // simple unsharp mask
  function applyUnsharpMask(canvasEl, strength='mild') {
    if (!canvasEl || !canvasEl.getContext) return;
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width, h = canvasEl.height;
    const imageData = ctx.getImageData(0,0,w,h); const data = imageData.data;
    const radius = strength === 'strong' ? 2 : 1;
    const amount = strength === 'strong' ? 1.2 : 0.6;
    const tmp = document.createElement('canvas'); tmp.width = Math.max(1,Math.floor(w/(radius+1))); tmp.height = Math.max(1,Math.floor(h/(radius+1)));
    const tctx = tmp.getContext('2d'); tctx.imageSmoothingEnabled=true; tctx.imageSmoothingQuality='high';
    tctx.drawImage(canvasEl,0,0,w,h,0,0,tmp.width,tmp.height);
    const t2 = document.createElement('canvas'); t2.width=w; t2.height=h;
    const t2ctx = t2.getContext('2d'); t2ctx.imageSmoothingEnabled=true; t2ctx.imageSmoothingQuality='high';
    t2ctx.drawImage(tmp,0,0,tmp.width,tmp.height,0,0,w,h);
    const blurData = t2ctx.getImageData(0,0,w,h).data;
    for (let i=0;i<data.length;i+=4){
      for (let c=0;c<3;c++){
        const orig = data[i+c]; const blurred = blurData[i+c];
        let val = orig + amount*(orig - blurred);
        if (val<0) val=0; if (val>255) val=255; data[i+c]=val;
      }
    }
    ctx.putImageData(imageData,0,0);
  }

  // compose final polaroid canvas from a source canvas (source is image cropped/resized to photo area)
  function composePolaroidFromPhotoCanvas(photoCanvas) {
    const dpi = Math.max(72, Math.min(1200, Number(dpiInput.value) || 300));
    const frame = computePolaroidFrame(4,6,dpi);
    const final = document.createElement('canvas');
    final.width = frame.totalW; final.height = frame.totalH;
    const fctx = final.getContext('2d');
    fctx.fillStyle='#fff'; fctx.fillRect(0,0,final.width,final.height);
    // insert photoCanvas resized to photo area
    fctx.drawImage(photoCanvas, 0,0,photoCanvas.width,photoCanvas.height, frame.marginLeft, frame.marginTop, frame.photoW, frame.photoH);
    // thin border
    fctx.strokeStyle='#ededed'; fctx.lineWidth = Math.max(1, Math.round(dpi*0.003));
    fctx.strokeRect(frame.marginLeft-1, frame.marginTop-1, frame.photoW+2, frame.photoH+2);

    // caption
    const caption = (captionInput.value || '').trim();
    if (caption) {
      fctx.fillStyle = '#222';
      const fontSize = Math.round(dpi * 0.06);
      fctx.font = `${fontSize}px sans-serif`;
      fctx.textAlign = 'center';
      const captionY = Math.round(frame.marginTop + frame.photoH + frame.marginBottom * 0.55);
      fctx.fillText(caption, final.width/2, captionY);
    }

    return new Promise(res => final.toBlob(blob => res({ blob, canvas: final }), 'image/jpeg', 0.95));
  }

  // integrate vintage processing -> compose -> save (localStorage + download link)
  async function processAndCompose(imageOrCanvas, useVintage=true) {
    try {
      // Apply vintage if requested (PolaroidFilters is global from polaroid-filters.js)
      let sourceCanvas = null;
      if (useVintage && window.PolaroidFilters && typeof PolaroidFilters.applyVintagePolaroid === 'function') {
        const intensity = parseFloat(document.getElementById('v_intensity').value);
        const grain = parseFloat(document.getElementById('v_grain').value);
        const warm = parseFloat(document.getElementById('v_warm').value);
        const res = await PolaroidFilters.applyVintagePolaroid(imageOrCanvas, {
          intensity: intensity,
          grain: grain,
          warm: warm,
          blur: 1.0,
          lightLeak: 0.6,
          curtain: 0.55,
          scratches: 0.08,
          lightColor: '255,190,120'
        });
        sourceCanvas = res.canvas;
      } else {
        // if user selected plain, convert image to canvas
        const c = document.createElement('canvas');
        c.width = imageOrCanvas.naturalWidth || imageOrCanvas.width;
        c.height = imageOrCanvas.naturalHeight || imageOrCanvas.height;
        c.getContext('2d').drawImage(imageOrCanvas,0,0,c.width,c.height);
        sourceCanvas = c;
      }

      // Now crop/fit according to selected fit and downscale to photo area
      const dpi = Math.max(72, Math.min(1200, Number(dpiInput.value) || 300));
      const frame = computePolaroidFrame(4,6,dpi);
      let photoW = frame.photoW, photoH = frame.photoH;
      // create crop canvas from sourceCanvas according to fit selection (cover/contain)
      const srcW = sourceCanvas.width, srcH = sourceCanvas.height;
      const srcAspect = srcW/srcH, targetAspect = photoW/photoH;
      let sx=0, sy=0, sW=srcW, sH=srcH;
      if (fitSelect.value === 'cover') {
        if (srcAspect > targetAspect) {
          sW = Math.round(srcH * targetAspect); sx = Math.round((srcW-sW)/2);
        } else {
          sH = Math.round(srcW / targetAspect); sy = Math.round((srcH-sH)/2);
        }
      } else {
        sW = srcW; sH = srcH; sx=0; sy=0;
      }
      const crop = document.createElement('canvas'); crop.width = sW; crop.height = sH;
      crop.getContext('2d').drawImage(sourceCanvas, sx,sy,sW,sH, 0,0,sW,sH);

      // progressive downscale crop to exact photo area size
      const photoCanvas = progressiveDownscale(crop, photoW, photoH);

      // optional sharpening if selected
      const sharpen = sharpenSelect.value || 'none';
      if (sharpen !== 'none') applyUnsharpMask(photoCanvas, sharpen);

      // create polaroid composition
      const { blob, canvas: finalCanvas } = await composePolaroidFromPhotoCanvas(photoCanvas);

      // update preview and gallery
      updatePreview(finalCanvas, blob);
      saveToLocalGallery(blob, finalCanvas);

    } catch (err) {
      console.error('processAndCompose error', err);
      alert('Processing failed: ' + (err && err.message ? err.message : err));
    }
  }

  function updatePreview(finalCanvas, blob) {
    // scale preview to fit visible canvas
    const maxW = 900;
    let scale = 1; if (finalCanvas.width > maxW) scale = maxW / finalCanvas.width;
    canvasEl.width = Math.round(finalCanvas.width * scale);
    canvasEl.height = Math.round(finalCanvas.height * scale);
    canvasEl.getContext('2d').clearRect(0,0,canvasEl.width,canvasEl.height);
    canvasEl.getContext('2d').drawImage(finalCanvas, 0,0, canvasEl.width, canvasEl.height);

    // prepare download link
    if (blob && downloadLink) {
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = 'polaroid_4x6.jpg';
      openNewTab.onclick = () => window.open(url, '_blank');
      infoText.textContent = `${finalCanvas.width}×${finalCanvas.height}px • ${dpiInput.value || 300} DPI`;
      document.getElementById('previewPanel').style.display = 'block';
      // revoke after a while
      setTimeout(()=>URL.revokeObjectURL(url), 30000);
    }
  }

  function saveToLocalGallery(blob, finalCanvas) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      arr.unshift({ id: Date.now(), dataUrl: dataUrl });
      while (arr.length > 30) arr.pop();
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
      renderGallery();
    };
    reader.readAsDataURL(blob);
  }

  function renderGallery() {
    const arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    galleryEl.innerHTML = '';
    if (!arr.length) { galleryEl.innerHTML = '<div class="small-muted">No captures yet</div>'; return; }
    arr.forEach(item => {
      const tile = document.createElement('div'); tile.className='tile';
      const img = document.createElement('img'); img.src = item.dataUrl;
      tile.appendChild(img);
      galleryEl.appendChild(tile);
    });
  }

  // wire events
  fileInput.addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) { generateBtn.disabled = true; generatePlainBtn.disabled = true; return; }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      generateBtn.disabled = false; generatePlainBtn.disabled = false;
      infoText.textContent = `${img.naturalWidth}×${img.naturalHeight}px`;
      document.getElementById('previewPanel').style.display = 'block';
      // show quick preview scaled
      updatePreview(img, null);
      URL.revokeObjectURL(url);
    };
    // avoid cross-origin taint for remote images (we use local files)
    img.src = url;
  });

  generateBtn.addEventListener('click', async () => {
    if (!currentImage) return;
    generateBtn.disabled = true; generateBtn.textContent = 'Generating...';
    try {
      await processAndCompose(currentImage, true);
    } finally {
      generateBtn.disabled = false; generateBtn.textContent = 'Generate Polaroid (with vintage)';
    }
  });

  generatePlainBtn.addEventListener('click', async () => {
    if (!currentImage) return;
    generatePlainBtn.disabled = true; generatePlainBtn.textContent = 'Generating...';
    try {
      await processAndCompose(currentImage, false);
    } finally {
      generatePlainBtn.disabled = false; generatePlainBtn.textContent = 'Generate Plain Polaroid';
    }
  });

  // initial render
  renderGallery();

})();
