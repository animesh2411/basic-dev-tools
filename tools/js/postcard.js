// App logic migrated from the original single-file HTML.
// Expects exif-js to be available globally (loaded before this script).

// UI elements
const fileInput = document.getElementById('file');
const generateBtn = document.getElementById('generate');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const previewBox = document.getElementById('previewBox');
const dpiInput = document.getElementById('dpi');
const fitSelect = document.getElementById('fit');
const formatSelect = document.getElementById('format');
const downloadLink = document.getElementById('downloadLink');
const openNewTab = document.getElementById('openNewTab');
const infoText = document.getElementById('infoText');
const captionInput = document.getElementById('caption');
const sharpenSelect = document.getElementById('sharpen');

let currentImage = null;
let currentEXIFOrientation = 1;
let currentFileName = 'polaroid';

fileInput.addEventListener('change', async (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) { generateBtn.disabled = true; previewBox.classList.add('hidden'); return; }
  currentFileName = (f.name && f.name.split('.').slice(0,-1).join('.')) || 'polaroid';

  currentEXIFOrientation = 1;
  if (f.type === 'image/jpeg' || f.type === 'image/jpg') {
    try {
      await new Promise((res) => {
        EXIF.getData(f, function(){ currentEXIFOrientation = EXIF.getTag(this, "Orientation") || 1; res(); });
      });
    } catch(e) { currentEXIFOrientation = 1; }
  }

  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    generateBtn.disabled = false;
    previewBox.classList.remove('hidden');
    infoText.textContent = `${img.naturalWidth}×${img.naturalHeight}px • EXIF:${currentEXIFOrientation}`;
    drawPreview();
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

// Create oriented full-size temp canvas from Image + EXIF
function orientedCanvasFromImage(img, orientation) {
  let w = img.naturalWidth, h = img.naturalHeight;
  if (orientation >= 5 && orientation <= 8) [w,h] = [h,w];
  const temp = document.createElement('canvas');
  temp.width = w; temp.height = h;
  const tctx = temp.getContext('2d');
  tctx.save();

  switch (orientation) {
    case 2: tctx.translate(w,0); tctx.scale(-1,1); break;
    case 3: tctx.translate(w,h); tctx.rotate(Math.PI); break;
    case 4: tctx.translate(0,h); tctx.scale(1,-1); break;
    case 5: tctx.rotate(0.5*Math.PI); tctx.scale(1,-1); break;
    case 6: tctx.rotate(0.5*Math.PI); tctx.translate(0,-h); break;
    case 7: tctx.rotate(0.5*Math.PI); tctx.translate(w,-h); tctx.scale(-1,1); break;
    case 8: tctx.rotate(-0.5*Math.PI); tctx.translate(-w,0); break;
    default: break;
  }

  tctx.drawImage(img, 0, 0);
  tctx.restore();
  return temp;
}

// Progressive downscale: halves until near target to preserve details
function progressiveDownscale(sourceCanvas, targetW, targetH) {
  let current = sourceCanvas;
  if (current.width < targetW || current.height < targetH) {
    const out = document.createElement('canvas');
    out.width = targetW; out.height = targetH;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
    octx.drawImage(current, 0,0,current.width,current.height, 0,0,targetW,targetH);
    return out;
  }
  while (current.width / 2 >= targetW && current.height / 2 >= targetH) {
    const half = document.createElement('canvas');
    half.width = Math.max(1, Math.floor(current.width/2));
    half.height = Math.max(1, Math.floor(current.height/2));
    const hctx = half.getContext('2d');
    hctx.imageSmoothingEnabled = true; hctx.imageSmoothingQuality = 'high';
    hctx.drawImage(current, 0,0,current.width,current.height, 0,0,half.width,half.height);
    current = half;
  }
  const final = document.createElement('canvas');
  final.width = targetW; final.height = targetH;
  const fctx = final.getContext('2d');
  fctx.imageSmoothingEnabled = true; fctx.imageSmoothingQuality = 'high';
  fctx.drawImage(current, 0,0,current.width,current.height, 0,0,targetW,targetH);
  return final;
}

// Simple unsharp mask (approx).
function applyUnsharpMask(canvasEl, strength='mild') {
  const ctx = canvasEl.getContext('2d');
  const w = canvasEl.width, h = canvasEl.height;
  const imageData = ctx.getImageData(0,0,w,h);
  const data = imageData.data;
  const radius = strength === 'strong' ? 2 : 1;
  const amount = strength === 'strong' ? 1.2 : 0.6;
  const tmp = document.createElement('canvas');
  tmp.width = Math.max(1, Math.floor(w/(radius+1)));
  tmp.height = Math.max(1, Math.floor(h/(radius+1)));
  const tctx = tmp.getContext('2d');
  tctx.imageSmoothingEnabled = true; tctx.imageSmoothingQuality = 'high';
  tctx.drawImage(canvasEl, 0,0,w,h, 0,0,tmp.width,tmp.height);
  const t2 = document.createElement('canvas'); t2.width = w; t2.height = h;
  const t2ctx = t2.getContext('2d');
  t2ctx.imageSmoothingEnabled = true; t2ctx.imageSmoothingQuality = 'high';
  t2ctx.drawImage(tmp, 0,0,tmp.width,tmp.height, 0,0,w,h);
  const blurData = t2ctx.getImageData(0,0,w,h).data;

  for (let i=0;i<data.length;i+=4){
    for (let c=0;c<3;c++){
      const orig = data[i+c];
      const blurred = blurData[i+c];
      let val = orig + amount*(orig - blurred);
      if (val < 0) val = 0; if (val > 255) val = 255;
      data[i+c] = val;
    }
  }
  ctx.putImageData(imageData, 0,0);
}

// Draw a preview scaled to fit the UI canvas
function drawPreview() {
  if (!currentImage) return;
  const previewDPI = 100;
  const dpi = Number(dpiInput.value) || 300;
  const scale = previewDPI / dpi;
  const widthIn = 4, heightIn = 6;
  const frame = computePolaroidFrame(widthIn, heightIn, dpi);
  const targetW = Math.round(frame.totalW * scale);
  const targetH = Math.round(frame.totalH * scale);

  const oriented = orientedCanvasFromImage(currentImage, currentEXIFOrientation);
  const imgW = oriented.width, imgH = oriented.height;

  const photoW = Math.round(frame.photoW * scale);
  const photoH = Math.round(frame.photoH * scale);

  const work = document.createElement('canvas'); work.width = targetW; work.height = targetH;
  const wctx = work.getContext('2d');
  wctx.fillStyle = '#ffffff'; wctx.fillRect(0,0,targetW,targetH);

  const drawX = Math.round(frame.marginLeft * scale);
  const drawY = Math.round(frame.marginTop * scale);

  const fit = fitSelect.value;
  const orientedAspect = imgW / imgH;
  const photoAspect = frame.photoW / frame.photoH;

  let sx=0, sy=0, sWidth=imgW, sHeight=imgH;
  if (fit === 'cover') {
    if (orientedAspect > photoAspect) {
      sWidth = Math.round(imgH * photoAspect);
      sx = Math.round((imgW - sWidth)/2);
    } else {
      sHeight = Math.round(imgW / photoAspect);
      sy = Math.round((imgH - sHeight)/2);
    }
  } else {
    sWidth = imgW; sHeight = imgH; sx=0; sy=0;
  }

  wctx.drawImage(oriented, sx, sy, sWidth, sHeight, drawX, drawY, photoW, photoH);
  wctx.strokeStyle = '#e9e9e9'; wctx.lineWidth = Math.max(1, Math.round(2*scale));
  wctx.strokeRect(drawX-1, drawY-1, photoW+2, photoH+2);

  const caption = captionInput.value || '';
  if (caption) {
    wctx.fillStyle = '#222';
    wctx.font = `${14*scale}px sans-serif`;
    wctx.textAlign = 'center';
    wctx.fillText(caption, targetW/2, Math.round((frame.marginTop + frame.photoH + frame.marginBottom/2) * scale) + (4*scale));
  }

  canvas.width = work.width; canvas.height = work.height;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(work,0,0);
}

function computePolaroidFrame(widthIn, heightIn, dpi) {
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

generateBtn.addEventListener('click', async () => {
  if (!currentImage) return;
  generateBtn.disabled = true; generateBtn.textContent = 'Generating...';
  try {
    const dpi = Math.max(72, Math.min(1200, Number(dpiInput.value) || 300));
    const fit = fitSelect.value;
    const format = formatSelect.value;
    const caption = captionInput.value || '';
    const sharpen = sharpenSelect.value;

    const frame = computePolaroidFrame(4,6,dpi);
    const targetW = frame.totalW, targetH = frame.totalH;
    const oriented = orientedCanvasFromImage(currentImage, currentEXIFOrientation);
    const imgW = oriented.width, imgH = oriented.height;

    const photoAspect = frame.photoW / frame.photoH;
    const orientedAspect = imgW / imgH;
    let sx=0, sy=0, sWidth=imgW, sHeight=imgH;
    if (fit === 'cover') {
      if (orientedAspect > photoAspect) {
        sWidth = Math.round(imgH * photoAspect);
        sx = Math.round((imgW - sWidth)/2);
      } else {
        sHeight = Math.round(imgW / photoAspect);
        sy = Math.round((imgH - sHeight)/2);
      }
    } else {
      sWidth = imgW; sHeight = imgH; sx=0; sy=0;
    }

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sWidth; cropCanvas.height = sHeight;
    const cctx = cropCanvas.getContext('2d');
    cctx.drawImage(oriented, sx, sy, sWidth, sHeight, 0,0, sWidth, sHeight);

    const photoCanvas = progressiveDownscale(cropCanvas, frame.photoW, frame.photoH);

    const originalW = (currentEXIFOrientation >=5 && currentEXIFOrientation <=8) ? currentImage.naturalHeight : currentImage.naturalWidth;
    const originalH = (currentEXIFOrientation >=5 && currentEXIFOrientation <=8) ? currentImage.naturalWidth : currentImage.naturalHeight;
    const upscaled = (originalW < frame.photoW || originalH < frame.photoH);
    if (sharpen !== 'none' || upscaled) {
      const strength = sharpen === 'strong' ? 'strong' : (sharpen === 'mild' ? 'mild' : (upscaled ? 'mild' : 'none'));
      if (strength !== 'none') applyUnsharpMask(photoCanvas, strength);
    }

    const final = document.createElement('canvas');
    final.width = targetW; final.height = targetH;
    const fctx = final.getContext('2d');

    fctx.fillStyle = '#ffffff'; fctx.fillRect(0,0,targetW,targetH);
    fctx.drawImage(photoCanvas, Math.round(frame.marginLeft), Math.round(frame.marginTop), Math.round(frame.photoW), Math.round(frame.photoH));
    fctx.strokeStyle = '#ededed'; fctx.lineWidth = Math.max(1, Math.round(dpi*0.003));
    fctx.strokeRect(Math.round(frame.marginLeft)-1, Math.round(frame.marginTop)-1, Math.round(frame.photoW)+2, Math.round(frame.photoH)+2);

    if (caption) {
      fctx.fillStyle = '#222';
      const fontSize = Math.round(dpi * 0.06);
      fctx.font = `${fontSize}px sans-serif`;
      fctx.textAlign = 'center';
      const captionY = Math.round(frame.marginTop + frame.photoH + frame.marginBottom*0.55);
      fctx.fillText(caption, targetW/2, captionY);
    }

    const previewMax = 900;
    let displayScale = 1;
    if (final.width > previewMax) displayScale = previewMax / final.width;
    canvas.width = Math.round(final.width * displayScale);
    canvas.height = Math.round(final.height * displayScale);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(final, 0,0, canvas.width, canvas.height);

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = 0.95;
    final.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = `${currentFileName}_polaroid_4x6_${dpi}dpi.${format==='png'?'png':'jpg'}`;
      openNewTab.onclick = () => { window.open(url, '_blank'); };
      infoText.textContent = `Output: ${final.width}×${final.height}px • ${dpi} DPI`;
    }, mime, quality);

  } catch (err) {
    console.error(err);
    alert('Error while generating: ' + (err && err.message ? err.message : err));
  } finally {
    generateBtn.disabled = false; generateBtn.textContent = 'Generate Polaroid 4×6';
    previewBox.classList.remove('hidden');
  }
});

// Mirror some inputs to update preview live
[dpiInput, fitSelect, captionInput, sharpenSelect].forEach(el => {
  el.addEventListener('input', () => { drawPreview(); });
});
fileInput.addEventListener('input', () => { setTimeout(drawPreview, 200); });
