/* ============================================================
   deck-shell.js v6.0.2 PATCHES
   Apply these 4 changes to your existing v6.0.1 file.
   ============================================================ */


// ============================================================
// PATCH 1: Add rasterizeIconoir() — place BEFORE exportIcon()
// Renders an Iconoir CSS font glyph to a canvas and returns
// a base64 PNG data URI for PPTX embedding.
// ============================================================

function rasterizeIconoir(iconName, hexColor, sizePx) {
  var el = document.createElement('i');
  el.className = 'iconoir-' + iconName;
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.fontSize = sizePx + 'px';
  document.body.appendChild(el);

  var computed = window.getComputedStyle(el, '::before');
  var content = computed.content;
  var fontFamily = computed.fontFamily;
  document.body.removeChild(el);

  // Extract character from content (comes as '"X"')
  var char = content.replace(/['"]/g, '');
  if (!char || char === 'none') {
    // Font not loaded or icon not found — return null
    return null;
  }

  var canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  var ctx = canvas.getContext('2d');
  ctx.font = sizePx + 'px ' + fontFamily;
  ctx.fillStyle = '#' + hexColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, sizePx / 2, sizePx / 2);

  return canvas.toDataURL('image/png');
}


// ============================================================
// PATCH 2: REPLACE the existing exportIcon() function
// Detects Iconoir vs emoji. Iconoir icons are rasterized to
// PNG and embedded as images. Emoji uses existing text path.
// ============================================================

function exportIcon(slide, el, isDark) {
  // Check if this is an Iconoir icon name
  if (SD.isIconoir && SD.isIconoir(el.icon)) {
    var hexColor = el.color
      ? SD.colorForPptx(el.color, isDark)
      : SD.colorForPptx('accent', isDark);
    var pngData = rasterizeIconoir(el.icon, hexColor, 256);

    if (pngData) {
      slide.addImage({
        data: pngData,
        x: el.x, y: el.y, w: el.w, h: el.h
      });
      return;
    }
    // Fallback to text if rasterization fails
  }

  // Emoji fallback (original behavior)
  var scale = (el.w >= 0.45) ? 0.50 : 0.42;
  var fontSize = Math.min(el.w, el.h) * 72 * scale;
  slide.addText(el.icon || '', {
    x: el.x, y: el.y, w: el.w, h: el.h,
    fontSize: fontSize, align: 'center', valign: 'middle',
    margin: [0, 0, 0, 0], lineSpacingMultiple: 1.0
  });
}


// ============================================================
// PATCH 3: Add exportBulletList() — place AFTER exportIcon()
// Exports 'bl' elements as native PptxGenJS bulleted text.
// Produces editable, reflowable bullets in PowerPoint.
// ============================================================

function exportBulletList(slide, el, isDark) {
  var items = el.items || [];
  var bulletHex = SD.colorForPptx(el.bulletColor || 'accent', isDark);
  var textHex = SD.colorForPptx(el.color || 'body', isDark);
  var fm = el.font === 'H';

  var textItems = items.map(function(item, i) {
    return {
      text: item,
      options: {
        bullet: { color: bulletHex },
        breakLine: i < items.length - 1,
        color: textHex,
        fontSize: el.size || 15,
        bold: fm
      }
    };
  });

  slide.addText(textItems, {
    x: el.x, y: el.y, w: el.w, h: el.h,
    fontFace: FONT,
    valign: 'top',
    paraSpaceAfter: 8,
    margin: [0, 0, 0, 0]
  });
}


// ============================================================
// PATCH 4: UPDATE exportElement() — add 'bl' to exporters map
// ============================================================

function exportElement(slide, el, isDark, accent, pptx) {
var exporters = {
  t: exportText, s: exportShape, o: exportOval,
  d: exportDivider, p: exportPill, b: exportBar,
  chart: exportChart, tbl: exportTable,
  i: exportIcon, img: exportImage,
  bl: exportBulletList    // v6.0.2: native bullet list
};
var fn = exporters[el.type];
if (fn) fn(slide, el, isDark, accent, pptx);
}


// ============================================================
// PATCH 5: UPDATE deckInit() — accent auto-detection fallback
// In the accent color section, add the auto-detect fallback:
// ============================================================

// FIND this block in deckInit():
//
//   if (config.accent) {
//     SD.setAccent(config.accent);
//   } else if (window.AH) {
//     SD.setAccent(window.AH, window.AL, window.AD);
//   }