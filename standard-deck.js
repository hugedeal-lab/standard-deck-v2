/* ============================================================
   standard-deck.js v6.0.2 PATCHES
   Apply these 5 changes to your existing v6.0.0 file.
   ============================================================ */


// ============================================================
// PATCH 1: Add detectAccent() — place AFTER detectBgMode()
// ============================================================

function detectAccent(title) {
  var t = (title || '').toLowerCase();
  if (/financ|revenue|growth|invest|banking|compliance|legal/.test(t)) return 'navy';
  if (/sustainab|esg|green|environment|carbon|climate|energy/.test(t)) return 'green';
  if (/health|wellness|medical|pharma|patient|clinical/.test(t)) return 'teal';
  if (/luxury|premium|fashion|beauty|lifestyle|hospitality/.test(t)) return 'plum';
  if (/tech|ai\b|digital|platform|engineer|data\b|cyber|software/.test(t)) return 'charcoal';
  if (/perform|kpi|result|roi\b|metric|benchmark|optimi/.test(t)) return 'gold';
  return 'red';
}


// ============================================================
// PATCH 2: Add isIconoir() — place AFTER detectAccent()
// ============================================================

function isIconoir(iconStr) {
  if (!iconStr || iconStr.length <= 2) return false;
  return /^[a-z][a-z0-9-]*$/.test(iconStr);
}


// ============================================================
// PATCH 3: REPLACE the existing renderIcon() function
// Detects Iconoir names vs emoji, renders accordingly.
// Iconoir icons receive a color prop; emoji stays as-is.
// ============================================================

function renderIcon(el, isDark) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;line-height:1;';
  div.style.left = toX(el.x) + 'px';
  div.style.top = toY(el.y) + 'px';
  div.style.width = toX(el.w) + 'px';
  div.style.height = toY(el.h) + 'px';

  var scale = (el.w >= 0.45) ? 0.55 : 0.45;
  var pxSize = Math.min(toX(el.w), toY(el.h)) * scale;

  if (isIconoir(el.icon)) {
    // Iconoir CSS font icon
    var i = document.createElement('i');
    i.className = 'iconoir-' + el.icon;
    i.style.fontSize = pxSize + 'px';
    i.style.color = el.color
      ? resolveColor(el.color, isDark)
      : resolveColor('accent', isDark);
    i.style.lineHeight = '1';
    div.appendChild(i);
  } else {
    // Emoji fallback
    div.style.fontSize = pxSize + 'px';
    div.textContent = el.icon || '';
  }

  return div;
}


// ============================================================
// PATCH 4: Add renderBulletList() — place AFTER renderIcon()
// New renderer for the 'bl' element type.
// ============================================================

function renderBulletList(el, isDark) {
  var container = document.createElement('div');
  container.style.cssText = 'position:absolute;overflow:hidden;';
  container.style.left = toX(el.x) + 'px';
  container.style.top = toY(el.y) + 'px';
  container.style.width = toX(el.w) + 'px';
  container.style.height = toY(el.h) + 'px';

  var items = el.items || [];
  var fontSize = ptToPx(el.size || 15);
  var bulletColor = resolveColor(el.bulletColor || 'accent', isDark);
  var textColor = resolveColor(el.color || 'body', isDark);
  var fm = FONT_MAP[el.font || 'B'];

  items.forEach(function(item) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:flex-start;margin-bottom:' + Math.round(fontSize * 0.5) + 'px;';

    var dot = document.createElement('div');
    var dotSize = Math.round(fontSize * 0.35);
    dot.style.cssText = 'width:' + dotSize + 'px;height:' + dotSize + 'px;'
      + 'border-radius:50%;flex-shrink:0;'
      + 'margin-top:' + Math.round(fontSize * 0.45) + 'px;'
      + 'margin-right:' + Math.round(fontSize * 0.6) + 'px;';
    dot.style.backgroundColor = bulletColor;

    var text = document.createElement('div');
    text.style.fontSize = fontSize + 'px';
    text.style.lineHeight = '1.5';
    text.style.color = textColor;
    text.style.fontFamily = fm.face;
    text.style.fontWeight = fm.weight;
    text.textContent = item;

    row.appendChild(dot);
    row.appendChild(text);
    container.appendChild(row);
  });

  return container;
}


// ============================================================
// PATCH 5: UPDATE renderElement() — add 'bl' to renderers map
// ============================================================

function renderElement(el, isDark) {
  var renderers = {
    t:     renderText,
    s:     renderShape,
    o:     renderOval,
    i:     renderIcon,
    d:     renderDivider,
    p:     renderPill,
    b:     renderBar,
    chart: renderChart,
    tbl:   renderTable,
    img:   renderImage,
    bl:    renderBulletList    // v6.0.2: native bullet list
  };
  var fn = renderers[el.type];
  if (!fn) {
    console.warn('[standard-deck] Unknown element type: ' + el.type);
    return document.createElement('div');
  }
  return fn(el, isDark);
}


// ============================================================
// PATCH 6: UPDATE public API — add new exports
// Add these to the window.StandardDeck = { ... } object:
// ============================================================

//   detectAccent:     detectAccent,
//   isIconoir:        isIconoir,