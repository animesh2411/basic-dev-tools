// polaroid-filters.js
// Vintage polaroid processing library
(function (global) {
  function createCanvas(w, h) { var c = document.createElement('canvas'); c.width=w;c.height=h; return c; }

  function drawImageFit(src, destCtx, destW, destH, fitMode) {
    var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    var sAspect = sw / sh, dAspect = destW / destH;
    var sx=0, sy=0, sW=sw, sH=sh;
    if (fitMode === 'cover') {
      if (sAspect > dAspect) { sW = Math.round(sh * dAspect); sx = Math.round((sw - sW) / 2); }
      else { sH = Math.round(sw / dAspect); sy = Math.round((sh - sH) / 2); }
      destCtx.drawImage(src, sx, sy, sW, sH, 0, 0, destW, destH);
      return;
    } else {
      // contain
      var drawW = destW, drawH = destH;
      if (sAspect > dAspect) { drawW = destW; drawH = Math.round(destW / sAspect); }
      else { drawH = destH; drawW = Math.round(destH * sAspect); }
      var dx = Math.round((destW - drawW)/2), dy = Math.round((destH - drawH)/2);
      destCtx.drawImage(src, 0,0,sw,sh, dx,dy, drawW, drawH);
      return;
    }
  }

  function drawWithBlur(srcCanvas, blurPx) {
    if (!blurPx || blurPx <= 0) return srcCanvas;
    var c = createCanvas(srcCanvas.width, srcCanvas.height);
    var ctx = c.getContext('2d');
    if ('filter' in ctx) {
      ctx.filter = 'blur(' + blurPx + 'px)';
      ctx.drawImage(srcCanvas, 0, 0);
      ctx.filter = 'none';
      return c;
    }
    // fallback cheap blur
    var tmp = createCanvas(Math.max(1,Math.floor(srcCanvas.width/2)), Math.max(1,Math.floor(srcCanvas.height/2)));
    tmp.getContext('2d').drawImage(srcCanvas,0,0,tmp.width,tmp.height);
    var out = createCanvas(srcCanvas.width, srcCanvas.height);
    out.getContext('2d').imageSmoothingEnabled = true;
    out.getContext('2d').drawImage(tmp,0,0,tmp.width,tmp.height,0,0,out.width,out.height);
    return out;
  }

  function applyVignette(ctx,w,h,strength) {
    var gx = ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*0.2,w/2,h/2,Math.max(w,h)*0.8);
    gx.addColorStop(0,'rgba(0,0,0,0)');
    gx.addColorStop(0.6,'rgba(0,0,0,' + (0.25 * strength) + ')');
    gx.addColorStop(1,'rgba(0,0,0,' + (0.7 * strength) + ')');
    ctx.globalCompositeOperation='multiply';
    ctx.fillStyle=gx; ctx.fillRect(0,0,w,h); ctx.globalCompositeOperation='source-over';
  }

  function applyWarmTone(ctx,w,h,amount) {
    if (!amount || amount<=0) return;
    try {
      var img = ctx.getImageData(0,0,w,h); var data = img.data;
      for (var i=0;i<data.length;i+=4) {
        data[i] = Math.min(255, data[i] + amount * 18);
        data[i+1] = Math.min(255, data[i+1] + amount * 8);
        data[i+2] = Math.max(0, data[i+2] - amount * 6);
        data[i] = Math.min(255, ((data[i]-128)*(1+amount*0.06))+128);
        data[i+1] = Math.min(255, ((data[i+1]-128)*(1+amount*0.04))+128);
        data[i+2] = Math.min(255, ((data[i+2]-128)*(1+amount*0.02))+128);
      }
      ctx.putImageData(img,0,0);
    } catch (e) {
      // on some mobile browsers getImageData may be restricted for cross-origin images
      console.warn('applyWarmTone failed', e);
    }
  }

  function applySoftCurtain(ctx,w,h,intensity) {
    if (!intensity || intensity<=0) return;
    ctx.globalCompositeOperation='screen';
    var g=ctx.createLinearGradient(0,-h*0.2,0,h*0.2);
    g.addColorStop(0,'rgba(255,255,255,' + (0.45*intensity) + ')');
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h*0.2);
    var g2=ctx.createLinearGradient(0,h*0.8,0,h*1.2);
    g2.addColorStop(0,'rgba(255,255,255,0)');
    g2.addColorStop(1,'rgba(255,255,255,' + (0.35*intensity) + ')');
    ctx.fillStyle=g2; ctx.fillRect(0,h*0.8,w,h*0.2);
    ctx.globalCompositeOperation='source-over';
  }

  function applyGrain(ctx,w,h,amount) {
    if (!amount || amount<=0) return;
    var noise = ctx.createImageData(w,h); var d=noise.data;
    for (var i=0;i<d.length;i+=4) {
      var v = (Math.random()*255)|0;
      d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=(amount*255*(0.6+Math.random()*0.4))|0;
    }
    var nc = createCanvas(w,h); var nctx=nc.getContext('2d'); nctx.putImageData(noise,0,0);
    ctx.globalAlpha = 0.18 * amount;
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(nc,0,0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  function applyLightLeak(ctx,w,h,color,strength) {
    if (!strength || strength<=0) return;
    var leak = ctx.createRadialGradient(w*0.9,h*0.15,10, w*0.4,h*0.25, Math.max(w,h)*0.9);
    leak.addColorStop(0,'rgba(' + color + ',' + (0.35*strength) + ')');
    leak.addColorStop(0.35,'rgba(' + color + ',' + (0.12*strength) + ')');
    leak.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalCompositeOperation='screen';
    ctx.fillStyle=leak; ctx.fillRect(0,0,w,h); ctx.globalCompositeOperation='source-over';
  }

  function applyScratches(ctx,w,h,strength) {
    if (!strength || strength<=0) return;
    ctx.save(); ctx.globalAlpha = 0.06 * strength; ctx.strokeStyle='rgba(255,255,255,0.2)';
    for (var i=0;i<6;i++) { var y=Math.random()*h; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w, y + (Math.random()*8 - 4)); ctx.stroke(); }
    ctx.restore();
  }

  function applyVintagePolaroid(src, opts) {
    opts = opts || {};
    var intensity = (typeof opts.intensity === 'number') ? opts.intensity : 0.9;
    var grain = (typeof opts.grain === 'number') ? opts.grain : 0.08;
    var warm = (typeof opts.warm === 'number') ? opts.warm : 0.12;
    var blur = (typeof opts.blur === 'number') ? opts.blur : 0.8;
    var lightLeak = (typeof opts.lightLeak === 'number') ? opts.lightLeak : 0.6;
    var curtain = (typeof opts.curtain === 'number') ? opts.curtain : 0.6;
    var scratches = (typeof opts.scratches === 'number') ? opts.scratches : 0.1;
    var color = opts.lightColor || '255,180,100';
    var outW = src.naturalWidth || src.width || 1600;
    var outH = src.naturalHeight || src.height || 2400;
    var maxDim = 3000;
    if (Math.max(outW,outH) > maxDim) { var scale = maxDim / Math.max(outW,outH); outW = Math.round(outW * scale); outH = Math.round(outH * scale); }

    // draw source
    var base = createCanvas(outW,outH); var bctx = base.getContext('2d');
    drawImageFit(src,bctx,outW,outH,'cover');

    // blur
    var blurred = drawWithBlur(base, blur);

    var final = createCanvas(outW,outH); var fctx = final.getContext('2d');
    fctx.drawImage(blurred,0,0);

    applyWarmTone(fctx,outW,outH,warm * intensity);
    applyVignette(fctx,outW,outH,0.9 * intensity);
    applySoftCurtain(fctx,outW,outH,curtain * intensity);
    applyLightLeak(fctx,outW,outH,color,lightLeak * intensity);
    applyGrain(fctx,outW,outH,grain * intensity);
    applyScratches(fctx,outW,outH,scratches * intensity);

    return new Promise(function(resolve){
      final.toBlob(function(blob){ resolve({ canvas: final, blob: blob }); }, 'image/jpeg', 0.92);
    });
  }

  global.PolaroidFilters = { applyVintagePolaroid: applyVintagePolaroid };
})(window);
