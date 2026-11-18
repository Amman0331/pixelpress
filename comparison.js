'use strict';

// Sample native-resolution tiles so small print and edges aren't blurred by thumbnail scaling.
function sampleTiles(image, width, height) {
  const tileWidth = Math.min(8, width);
  const tileHeight = Math.min(8, height);
  const columns = Math.min(24, Math.ceil(width / tileWidth));
  const rows = Math.min(24, Math.ceil(height / tileHeight));
  const sheet = document.createElement('canvas');
  sheet.width = columns * tileWidth;
  sheet.height = rows * tileHeight;
  const ctx = sheet.getContext('2d', {willReadFrequently:true});
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, sheet.width, sheet.height);
  for (let row = 0; row < rows; row++) {
    const y = Math.round(row * (height - tileHeight) / Math.max(1, rows - 1));
    for (let column = 0; column < columns; column++) {
      const x = Math.round(column * (width - tileWidth) / Math.max(1, columns - 1));
      ctx.drawImage(image, x, y, tileWidth, tileHeight, column * tileWidth, row * tileHeight, tileWidth, tileHeight);
    }
  }
  return ctx.getImageData(0, 0, sheet.width, sheet.height);
}

function similarityScore(before, after, tileWidth, tileHeight) {
  const count = tileWidth * tileHeight;
  const c1 = (0.01 * 255) ** 2, c2 = (0.03 * 255) ** 2;
  let sum = 0, comparisons = 0;
  for (let top = 0; top < before.height; top += tileHeight) {
    for (let left = 0; left < before.width; left += tileWidth) {
      for (let channel = 0; channel < 3; channel++) {
        let sx = 0, sy = 0, xx = 0, yy = 0, xy = 0;
        for (let y = top; y < top + tileHeight; y++) {
          for (let x = left; x < left + tileWidth; x++) {
            const i = (y * before.width + x) * 4 + channel;
            const a = before.data[i], b = after.data[i];
            sx += a; sy += b; xx += a*a; yy += b*b; xy += a*b;
          }
        }
        const mx = sx/count, my = sy/count;
        const variance = (xx + yy)/count - mx*mx - my*my;
        const covariance = xy/count - mx*my;
        sum += ((2*mx*my + c1) * (2*covariance + c2)) /
               ((mx*mx + my*my + c1) * (variance + c2));
        comparisons++;
      }
    }
  }
  return Math.min(1, Math.max(0, sum / comparisons));
}

async function compressionLoss(canvas, webpURL) {
  const image = new Image();
  image.src = webpURL;
  await image.decode();
  const {width, height} = canvas;
  const before = sampleTiles(canvas, width, height);
  const after = sampleTiles(image, width, height);
  return 100 * (1 - similarityScore(before, after, Math.min(8,width), Math.min(8,height)));
}

function lossText(loss) {
  if (!Number.isFinite(loss)) return 'Unavailable';
  if (loss < 0.000001) return '0%';
  return loss < 0.1 ? '<0.1%' : loss.toFixed(1)+'%';
}

let comparedURL = null;
let viewGeneration = 0;
async function showComparison(item) {
  if (item?.resultURL === comparedURL) return;
  const generation = ++viewGeneration;
  comparedURL = item?.resultURL ?? null;
  const panel = el('comparison');
  panel.hidden = !item;
  if (!item) {
    for (const id of ['original-frame','webp-frame']) el(id).width = el(id).height = 1;
    return;
  }
  el('compared-file').textContent = item.file.name;
  el('compare-loss').textContent = lossText(item.loss);
  const savings = 100 * (1 - item.output.size/item.file.size);
  el('compare-size').textContent = savings === 0 ? 'Same size' : Math.abs(savings).toFixed(1)+'% '+(savings > 0 ? 'smaller' : 'larger');
  el('compare-bytes').textContent = prettySize(item.file.size)+' → '+prettySize(item.output.size);
  el('compare-pixels').textContent = item.originalWidth+' × '+item.originalHeight+' → '+item.width+' × '+item.height+' px';
  el('wipe').value = 50;
  updateWipe();
  el('compare-stage').hidden = true;
  el('compare-loading').textContent = 'Loading preview…';
  try {
    const images = [new Image(), new Image()];
    images[0].src = item.url; images[1].src = item.resultURL;
    await Promise.all(images.map(image => image.decode()));
    if (generation !== viewGeneration) return;
    const scale = Math.min(1, 1600 / Math.max(item.width, item.height));
    const width = Math.max(1,Math.round(item.width*scale)), height = Math.max(1,Math.round(item.height*scale));
    for (const [index,id] of ['original-frame','webp-frame'].entries()) {
      const frame = el(id); frame.width = width; frame.height = height;
      const ctx = frame.getContext('2d'); ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(images[index], 0, 0, width, height);
    }
    el('compare-loading').textContent = '';
    el('compare-stage').hidden = false;
  } catch {
    if (generation === viewGeneration) el('compare-loading').textContent = 'The preview could not be displayed. Your WebP download is available.';
  }
}
function updateWipe() {
  const value = el('wipe').value;
  el('compare-stage').style.setProperty('--split', value+'%');
  el('wipe').setAttribute('aria-valuetext',value+' percent original');
}
