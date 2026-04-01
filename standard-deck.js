/* ============================================================
 standard-deck.js v5.1.3 -- Core Rendering Engine
 Standard Presentation Builder
 Phase 1.5: Footer redesign, text alignment, icon centering
 ============================================================ */

(function () {
'use strict';

var CANVAS_W = 1920;
var CANVAS_H = 1200;
var SLIDE_W  = 13.33;
var SLIDE_H  = 7.5;
var SX       = CANVAS_W / SLIDE_W;
var SY       = CANVAS_H / SLIDE_H;
var PT_PX    = SY / 72;

// ============================================================
// V5.1.1 LAYOUT CONSTANTS
// ============================================================

var SD_CONST = {
  SLIDE_W:     13.33,
  SLIDE_H:     7.50,
  SAFE_X_MIN:  0.50,
  SAFE_X_MAX:  12.92,
  SAFE_W:      12.42,
  SAFE_Y_MIN:  0.75,
  SAFE_Y_MAX:  7.00,
  BAR_H:       0.08,
  TAG_Y:       0.75,
  TAG_H:       0.25,
  TITLE_Y:     1.10,
  TITLE_H_1:   0.55,
  TITLE_H_2:   0.90,
  HEADER_END:  1.75,
  CONTENT_Y:   2.10,
  CONTENT_Y_2: 2.30,
  CONTENT_END: 6.80,
  FOOTER_Y:    7.00,
  GAP:         0.25,
  TEXT_RATIO:  0.80,
  GRID: {
    full:  { cols: [{ x: 0.50, w: 12.42 }] },
    col2:  { cols: [{ x: 0.50, w: 6.09 },
                    { x: 6.84, w: 6.08 }] },
    col3:  { cols: [{ x: 0.50, w: 3.97 },
                    { x: 4.72, w: 3.97 },
                    { x: 8.94, w: 3.97 }] },
    col4:  { cols: [{ x: 0.50,  w: 2.92 },
                    { x: 3.67,  w: 2.92 },
                    { x: 6.84,  w: 2.92 },
                    { x: 10.01, w: 2.92 }] }
  },
  TITLE_WRAP_THRESHOLD: 36
};

var SAFE = {
  x:  SD_CONST.SAFE_X_MIN,
  y:  SD_CONST.SAFE_Y_MIN,
  x2: SD_CONST.SAFE_X_MAX,
  y2: SD_CONST.SAFE_Y_MAX
};

var PALETTE = {
  black:  '#191919', white:  '#F5F5F5',
  dkGray: '#363732', mdGray: '#53544A',
  gray:   '#8B8C81', ltGray: '#C2C4B8',
  ok:     '#28A745', warn:   '#E67E00', bad: '#C12638'
};

var ACCENT_FAMILIES = {
  red:      { light: '#F4A0A0', mid: '#D50032', dark: '#8B0021' },
  blue:     { light: '#98AAAF', mid: '#1B3D6D', dark: '#0F2440' },
  gold:     { light: '#F9D28C', mid: '#C4962C', dark: '#8B6A00' },
  green:    { light: '#B5BF9B', mid: '#2E5A3A', dark: '#1A3622' },
  plum:     { light: '#B1A0B0', mid: '#6B3065', dark: '#3F1A3B' },
  teal:     { light: '#9ECFCF', mid: '#1A7A7A', dark: '#0F4E4E' },
  charcoal: { light: '#C2C4B8', mid: '#53544A', dark: '#363732' }
};

var _accentLight = '#F4A0A0';
var _accentMid   = '#D50032';
var _accentDark  = '#8B0021';
var _familyName  = 'red';

var FONT_MAP = {
  H: { face: 'Mazda Type, Classico URW, Montserrat, sans-serif', weight: 700 },
  B: { face: 'Mazda Type, Classico URW, Montserrat, sans-serif', weight: 400 }
};

var LIMITS = {
  bullets: 5, tableRows: 8, tableCols: 5,
  cards: 4, stats: 6, paragraphs: 3, rows: 4,
  cardTitleChars: 30, statLabelChars: 25,
  coverTitleChars: 40, titleChars: 48
};

var MIN_SIZES = {
  coverTitle: 36, title: 33, cardTitle: 21,
  subtitle: 18, body: 15, table: 12,
  statValue: 42, tag: 10, footnote: 9
};

// ============================================================
// V5.1.3: DATE GENERATION
// ============================================================

var MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY',
  'JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER',
  'NOVEMBER','DECEMBER'];

function getFooterDate() {
  var now = new Date();
  return MONTHS[now.getMonth()] + ' ' + now.getFullYear();
}

// ============================================================
// COLOR RESOLUTION
// ============================================================

function resolveColor(token, isDark) {
  if (token && token.charAt(0) === '#') return token;
  var semantics = {
    title:      isDark ? PALETTE.white    : PALETTE.black,
    body:       isDark ? PALETTE.ltGray   : PALETTE.mdGray,
    sub:        isDark ? _accentLight     : PALETTE.mdGray,
    muted:      PALETTE.gray,
    accent:     _accentMid,
    accentLt:   _accentLight,
    accentDk:   _accentDark,
    cardBg:     isDark ? PALETTE.dkGray   : '#FFFFFF',
    cardBorder: isDark ? 'transparent'    : PALETTE.ltGray,
    slideBg:    isDark ? PALETTE.black    : PALETTE.white,
    white:      '#FFFFFF',
    black:      '#000000'
  };
  if (semantics[token]) return semantics[token];
  if (PALETTE[token]) return PALETTE[token];
  return isDark ? PALETTE.white : PALETTE.black;
}

function colorForPptx(token, isDark) {
  return resolveColor(token, isDark).replace('#', '');
}

// ============================================================
// COORDINATE CONVERSION
// ============================================================

function toX(inches) { return Math.round(inches * SX); }
function toY(inches) { return Math.round(inches * SY); }
function ptToPx(pt)  { return Math.round(pt * PT_PX); }

// ============================================================
// V5.1.1 TITLE HEIGHT DETECTION
// ============================================================

function getTitleMetrics(title) {
  var len = (title || '').length;
  if (len > SD_CONST.TITLE_WRAP_THRESHOLD) {
    return {
      titleH:   SD_CONST.TITLE_H_2,
      contentY: SD_CONST.CONTENT_Y_2
    };
  }
  return {
    titleH:   SD_CONST.TITLE_H_1,
    contentY: SD_CONST.CONTENT_Y
  };
}

// ============================================================
// V5.1.1 SAFE AREA VALIDATION
// ============================================================

function validatePosition(el, slideIndex) {
  if (!el || typeof el.x === 'undefined' || typeof el.y === 'undefined') return;

  var C = SD_CONST;
  var right  = el.x + (el.w || 0);
  var bottom = el.y + (el.h || 0);

  if (el.type === 't' && el.y < C.CONTENT_Y) {
    if (el.y >= C.TAG_Y && el.y <= C.TITLE_Y + C.TITLE_H_2) {
      return;
    }
  }

  if (el.y < C.CONTENT_Y && el.type !== 't') {
    console.warn('[SD] Slide ' + slideIndex +
      ': Element at y:' + el.y +
      ' is above CONTENT_Y (' + C.CONTENT_Y + ')');
  }

  if (bottom > C.CONTENT_END) {
    console.warn('[SD] Slide ' + slideIndex +
      ': Element bottom at y:' + bottom.toFixed(2) +
      ' exceeds CONTENT_END (' + C.CONTENT_END + ')');
  }

  if (right > C.SAFE_X_MAX) {
    console.warn('[SD] Slide ' + slideIndex +
      ': Element right edge at x:' + right.toFixed(2) +
      ' exceeds SAFE_X_MAX (' + C.SAFE_X_MAX + ')');
  }
}

// ============================================================
// SLIDE & ELEMENT VALIDATION
// ============================================================

function validateSlide(slide, index) {
  var warn = function (msg) {
    console.warn('[standard-deck] Slide ' + index + ': ' + msg);
  };
  if (slide.layout && slide.els) {
    warn('has both layout and els -- layout takes precedence');
    delete slide.els;
  }
  var maxTitle = (slide.layout === 'cover' || slide.layout === 'closing')
    ? LIMITS.coverTitleChars : LIMITS.titleChars;
  if (slide.title && slide.title.length > maxTitle) {
    warn('title "' + slide.title.substring(0, 20) + '..." exceeds '
      + maxTitle + ' chars -- truncating');
    slide.title = slide.title.substring(0, maxTitle - 3) + '...';
  }
  if (slide.els) {
    slide.els = slide.els.map(function (el) {
      return validateElement(el, slide, index);
    });
  }
  return slide;
}

function validateElement(el, slide, slideIndex) {
  if (el.type === 't' && typeof el.size === 'number') {
    if (el.size < MIN_SIZES.footnote) {
      el.size = MIN_SIZES.footnote;
    }
  }
  if (typeof el.x === 'number' && el.x < SD_CONST.SAFE_X_MIN) {
    el.x = SD_CONST.SAFE_X_MIN;
  }
  if (typeof el.y === 'number' && el.y < SD_CONST.SAFE_Y_MIN) {
    el.y = SD_CONST.SAFE_Y_MIN;
  }
  if (el.type === 't' && el._parentShape) {
    var maxW = el._parentShape.w * SD_CONST.TEXT_RATIO;
    if (el.w > maxW) {
      el.x = el._parentShape.x + (el._parentShape.w - maxW) / 2;
      el.w = maxW;
    }
  }
  return el;
}

function enforceWidthRule(els) {
  var shapes = els.filter(function (e) {
    return e.type === 's' || e.type === 'o';
  });
  els.forEach(function (el) {
    if (el.type !== 't') return;
    for (var i = 0; i < shapes.length; i++) {
      var s = shapes[i];
      if (el.x >= s.x && el.y >= s.y
        && el.x + el.w <= s.x + s.w + 0.01
        && el.y + el.h <= s.y + s.h + 0.01) {
        var maxW = s.w * SD_CONST.TEXT_RATIO;
        if (el.w > maxW) {
          el.x = s.x + (s.w - maxW) / 2;
          el.w = maxW;
        }
        break;
      }
    }
  });
  return els;
}

// ============================================================
// ELEMENT RENDERERS
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
    img:   renderImage
  };
  var fn = renderers[el.type];
  if (!fn) {
    console.warn('[standard-deck] Unknown element type: ' + el.type);
    return document.createElement('div');
  }
  return fn(el, isDark);
}

// PHASE 1 FIX: overflow:visible for titles
// PHASE 1.5 FIX: textAlign support + compact auto-center
function renderText(el, isDark) {
  var div = document.createElement('div');
  var isTitle = (el.size >= 30);
  div.style.cssText = 'position:absolute;box-sizing:border-box;word-wrap:break-word;overflow:' + (isTitle ? 'visible' : 'hidden') + ';';
  div.style.left     = toX(el.x) + 'px';
  div.style.top      = toY(el.y) + 'px';
  div.style.width    = toX(el.w) + 'px';
  div.style.height   = toY(el.h) + 'px';
  div.style.fontSize = ptToPx(el.size) + 'px';
  div.style.color    = resolveColor(el.color || 'body', isDark);
  div.style.lineHeight = '1.35';
  var fm = FONT_MAP[el.font || 'B'];
  div.style.fontFamily = fm.face;
  div.style.fontWeight = fm.weight;
  if (el.bold) div.style.fontWeight = 700;
  if (el.italic) div.style.fontStyle = 'italic';

  // PHASE 1.5: Text alignment with compact auto-center
  var isCompact = el.w <= 0.80 && el.h <= 0.80;
  div.style.textAlign = el.align || (isCompact ? 'center' : 'left');

  if (el.valign === 'middle' || el.valign === 'bottom') {
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.justifyContent = el.valign === 'middle' ? 'center' : 'flex-end';
    // Preserve textAlign inside flex container
    if (isCompact || el.align === 'center') {
      div.style.alignItems = 'center';
    }
  }
  if (el.text && el.text.indexOf('\n') > -1) {
    el.text.split('\n').forEach(function (line, i) {
      if (i > 0) div.appendChild(document.createElement('br'));
      div.appendChild(document.createTextNode(line));
    });
  } else {
    var span = document.createElement('span');
    span.textContent = el.text || '';
    div.appendChild(span);
  }
  return div;
}

function renderShape(el, isDark) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;';
  div.style.left   = toX(el.x) + 'px';
  div.style.top    = toY(el.y) + 'px';
  div.style.width  = toX(el.w) + 'px';
  div.style.height = toY(el.h) + 'px';
  div.style.backgroundColor = resolveColor(el.fill || 'cardBg', isDark);
  if (el.border) {
    div.style.border = '1px solid ' + resolveColor(el.border, isDark);
  }
  if (el.transparency) {
    div.style.opacity = (100 - el.transparency) / 100;
  }
  return div;
}

function renderOval(el, isDark) {
  var div = renderShape(el, isDark);
  div.style.borderRadius = '50%';
  return div;
}

// PHASE 1.5 FIX: Reduced scale 0.6→0.5, added line-height:1
function renderIcon(el) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;line-height:1;';
  div.style.left     = toX(el.x) + 'px';
  div.style.top      = toY(el.y) + 'px';
  div.style.width    = toX(el.w) + 'px';
  div.style.height   = toY(el.h) + 'px';
  div.style.fontSize = Math.min(toX(el.w), toY(el.h)) * 0.5 + 'px';
  div.textContent    = el.icon || '';
  return div;
}

function renderDivider(el, isDark) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;';
  div.style.left            = toX(el.x) + 'px';
  div.style.top             = toY(el.y) + 'px';
  div.style.width           = toX(el.w) + 'px';
  div.style.height          = '0';
  div.style.borderTop       = '2px solid ' + resolveColor(el.color || 'ltGray', isDark);
  return div;
}

function renderPill(el, isDark) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;display:flex;align-items:center;justify-content:center;border-radius:100px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;';
  div.style.left            = toX(el.x) + 'px';
  div.style.top             = toY(el.y) + 'px';
  div.style.width           = toX(el.w) + 'px';
  div.style.height          = toY(el.h) + 'px';
  div.style.fontSize        = ptToPx(el.size || 9) + 'px';
  div.style.backgroundColor = resolveColor(el.fill || 'accent', isDark);
  div.style.color           = resolveColor(el.color || 'white', isDark);
  div.textContent           = el.text || '';
  return div;
}

function renderBar(el, isDark) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;';
  div.style.left            = toX(el.x) + 'px';
  div.style.top             = toY(el.y) + 'px';
  div.style.width           = toX(el.w) + 'px';
  div.style.height          = toY(el.h) + 'px';
  div.style.backgroundColor = resolveColor(el.fill || 'accent', isDark);
  return div;
}

// ============================================================
// CHART RENDERERS
// ============================================================

function renderChart(el, isDark) {
  var container = document.createElement('div');
  container.style.cssText = 'position:absolute;overflow:hidden;background:' + resolveColor('cardBg', isDark) + ';border:1px solid ' + resolveColor('ltGray', isDark) + ';';
  container.style.left   = toX(el.x) + 'px';
  container.style.top    = toY(el.y) + 'px';
  container.style.width  = toX(el.w) + 'px';
  container.style.height = toY(el.h) + 'px';
  var cw = toX(el.w);
  var ch = toY(el.h);
  var canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var data = el.data || [];
  var opts = el.opts || {};
  if (opts.showTitle && opts.title) {
    ctx.font = '600 ' + ptToPx(12) + 'px DM Sans, sans-serif';
    ctx.fillStyle = resolveColor('title', isDark);
    ctx.fillText(opts.title, 20, ptToPx(14) + 10);
  }
  var chartType = el.chartType || 'bar';
  if (chartType === 'bar') {
    renderBarChart(ctx, data, opts, cw, ch, isDark);
  } else if (chartType === 'line' || chartType === 'area') {
    renderLineChart(ctx, data, opts, cw, ch, isDark, chartType === 'area');
  } else if (chartType === 'pie' || chartType === 'doughnut') {
    renderPieChart(ctx, data, opts, cw, ch, isDark, chartType === 'doughnut');
  }
  return container;
}

function renderBarChart(ctx, data, opts, cw, ch, isDark) {
  if (!data.length || !data[0].values) return;
  var series   = data;
  var labels   = series[0].labels || [];
  var nGroups  = labels.length;
  var nSeries  = series.length;
  var maxVal   = 0;
  series.forEach(function (s) {
    s.values.forEach(function (v) {
      if (v > maxVal) maxVal = v;
    });
  });
  if (maxVal === 0) maxVal = 1;
  var padding  = { top: 60, right: 40, bottom: 50, left: 60 };
  var plotW    = cw - padding.left - padding.right;
  var plotH    = ch - padding.top - padding.bottom;
  var groupW   = plotW / nGroups;
  var barW     = (groupW * 0.7) / nSeries;
  var gap      = groupW * 0.3;
  var colors = resolveChartColors(opts.chartColors || ['accent', 'dkGray'], nSeries, isDark);
  series.forEach(function (s, si) {
    s.values.forEach(function (val, vi) {
      var bx = padding.left + vi * groupW + gap / 2 + si * barW;
      var bh = (val / maxVal) * plotH;
      var by = padding.top + plotH - bh;
      ctx.fillStyle = colors[si];
      ctx.fillRect(bx, by, barW - 2, bh);
      if (opts.showValue) {
        ctx.font = '500 ' + ptToPx(8) + 'px DM Sans, sans-serif';
        ctx.fillStyle = resolveColor('title', isDark);
        ctx.textAlign = 'center';
        ctx.fillText(formatVal(val), bx + barW / 2, by - 6);
      }
    });
  });
  ctx.font = ptToPx(8) + 'px DM Sans, sans-serif';
  ctx.fillStyle = resolveColor('muted', isDark);
  ctx.textAlign = 'center';
  labels.forEach(function (lbl, i) {
    var lx = padding.left + i * groupW + groupW / 2;
    ctx.fillText(lbl, lx, ch - padding.bottom + 20);
  });
}

function renderLineChart(ctx, data, opts, cw, ch, isDark, isArea) {
  if (!data.length || !data[0].values) return;
  var series  = data;
  var labels  = series[0].labels || [];
  var nPoints = labels.length;
  var maxVal  = 0;
  series.forEach(function (s) {
    s.values.forEach(function (v) {
      if (v > maxVal) maxVal = v;
    });
  });
  if (maxVal === 0) maxVal = 1;
  var padding = { top: 60, right: 40, bottom: 50, left: 60 };
  var plotW   = cw - padding.left - padding.right;
  var plotH   = ch - padding.top - padding.bottom;
  var colors = resolveChartColors(opts.chartColors || ['accent', 'dkGray'], series.length, isDark);
  series.forEach(function (s, si) {
    ctx.beginPath();
    ctx.strokeStyle = colors[si];
    ctx.lineWidth = 3;
    s.values.forEach(function (val, vi) {
      var px = padding.left + (vi / (nPoints - 1 || 1)) * plotW;
      var py = padding.top + plotH - (val / maxVal) * plotH;
      if (vi === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    if (isArea) {
      ctx.lineTo(padding.left + plotW, padding.top + plotH);
      ctx.lineTo(padding.left, padding.top + plotH);
      ctx.closePath();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = colors[si];
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
    ctx.stroke();
    s.values.forEach(function (val, vi) {
      var px = padding.left + (vi / (nPoints - 1 || 1)) * plotW;
      var py = padding.top + plotH - (val / maxVal) * plotH;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = colors[si];
      ctx.fill();
    });
  });
  ctx.font = ptToPx(8) + 'px DM Sans, sans-serif';
  ctx.fillStyle = resolveColor('muted', isDark);
  ctx.textAlign = 'center';
  labels.forEach(function (lbl, i) {
    var lx = padding.left + (i / (nPoints - 1 || 1)) * plotW;
    ctx.fillText(lbl, lx, ch - padding.bottom + 20);
  });
}

function renderPieChart(ctx, data, opts, cw, ch, isDark, isDoughnut) {
  if (!data.length || !data[0].values) return;
  var values = data[0].values;
  var labels = data[0].labels || [];
  var total  = values.reduce(function (a, b) { return a + b; }, 0);
  if (total === 0) return;
  var cx     = cw / 2;
  var cy     = ch / 2;
  var radius = Math.min(cw, ch) * 0.35;
  var hole   = isDoughnut ? radius * ((opts.holeSize || 70) / 100) : 0;
  var colors = resolveChartColors(opts.chartColors || ['accent', 'dkGray', 'ltGray', 'gray', 'ok', 'warn', 'bad', 'mdGray'], values.length, isDark);
  var startAngle = -Math.PI / 2;
  values.forEach(function (val, i) {
    var sliceAngle = (val / total) * Math.PI * 2;
    var endAngle   = startAngle + sliceAngle;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    if (isDoughnut) {
      ctx.arc(cx, cy, hole, endAngle, startAngle, true);
    } else {
      ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    if (opts.showPercent !== false) {
      var midAngle = startAngle + sliceAngle / 2;
      var labelR   = isDoughnut ? (radius + hole) / 2 : radius * 0.65;
      var lx = cx + Math.cos(midAngle) * labelR;
      var ly = cy + Math.sin(midAngle) * labelR;
      ctx.font = '600 ' + ptToPx(9) + 'px DM Sans, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var pct = Math.round((val / total) * 100) + '%';
      ctx.fillText(pct, lx, ly);
    }
    startAngle = endAngle;
  });
  if (opts.showLegend !== false) {
    var legendY = cy + radius + 30;
    ctx.font = ptToPx(8) + 'px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    labels.forEach(function (lbl, i) {
      var lx = 40 + i * (cw / labels.length);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(lx, legendY, 12, 12);
      ctx.fillStyle = resolveColor('body', isDark);
      ctx.fillText(lbl, lx + 18, legendY);
    });
  }
}

function resolveChartColors(tokens, count, isDark) {
  var colors = [];
  for (var i = 0; i < count; i++) {
    var token = tokens[i % tokens.length];
    colors.push(resolveColor(token, isDark));
  }
  return colors;
}

function formatVal(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
  if (v % 1 !== 0) return v.toFixed(1);
  return v.toString();
}

// ============================================================
// TABLE RENDERER
// ============================================================

function renderTable(el, isDark) {
  var container = document.createElement('div');
  container.style.cssText = 'position:absolute;overflow:hidden;';
  container.style.left   = toX(el.x) + 'px';
  container.style.top    = toY(el.y) + 'px';
  container.style.width  = toX(el.w) + 'px';
  container.style.height = toY(el.h) + 'px';
  var table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-family:DM Sans,sans-serif;font-size:' + ptToPx(10) + 'px;';
  var headers = el.headers || [];
  var rows    = el.rows || [];
  var colW    = el.colW;
  if (headers.length) {
    var thead = document.createElement('thead');
    var tr    = document.createElement('tr');
    headers.forEach(function (h, i) {
      var th = document.createElement('th');
      th.textContent = h;
      th.style.cssText = 'padding:12px 16px;text-align:left;background:' + resolveColor('accent', isDark) + ';color:#FFFFFF;font-weight:600;border-bottom:2px solid ' + resolveColor('ltGray', isDark) + ';';
      if (colW && colW[i]) th.style.width = toX(colW[i]) + 'px';
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  var tbody = document.createElement('tbody');
  rows.forEach(function (row, ri) {
    var tr = document.createElement('tr');
    tr.style.background = ri % 2 === 0 ? 'transparent' : resolveColor(isDark ? 'dkGray' : 'ltGray', isDark) + '33';
    (Array.isArray(row) ? row : [row]).forEach(function (cell) {
      var td = document.createElement('td');
      td.textContent = cell;
      td.style.cssText = 'padding:10px 16px;border-bottom:1px solid ' + resolveColor('ltGray', isDark) + '44;color:' + resolveColor('body', isDark) + ';';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  return container;
}

// ============================================================
// IMAGE RENDERER
// ============================================================

function renderImage(el) {
  var div = document.createElement('div');
  div.style.cssText = 'position:absolute;overflow:hidden;background:#E8E8E8;';
  div.style.left   = toX(el.x) + 'px';
  div.style.top    = toY(el.y) + 'px';
  div.style.width  = toX(el.w) + 'px';
  div.style.height = toY(el.h) + 'px';
  if (el.ref) div.id = el.ref;
  return div;
}

// ============================================================
// SLIDE RENDERING
// V5.1.3: New footer — date left, number+logo+divider right
// ============================================================

function renderSlide(slideData, index) {
  var isDark = !!slideData.dark;
  var slide = document.createElement('div');
  slide.className = 'slide' + (index === 0 ? ' active' : '');
  slide.style.cssText = 'position:absolute;top:0;left:0;width:1920px;height:1200px;overflow:hidden;background:' + resolveColor('slideBg', isDark) + ';';

  // Brand bar (left edge)
  var brandBar = document.createElement('div');
  brandBar.style.cssText = 'position:absolute;left:0;top:0;width:8px;height:100%;background:' + resolveColor('accent', isDark) + ';';
  brandBar.setAttribute('data-accent', 'backgroundColor');
  slide.appendChild(brandBar);

  // Render slide content (layouts or raw els)
  var els;
  if (slideData.layout) {
    els = window.DeckLayouts ? window.DeckLayouts.dispatch(slideData) : [];
  } else {
    els = slideData.els || [];
  }
  els = enforceWidthRule(els);
  els.forEach(function (el) {
    validatePosition(el, index);
    slide.appendChild(renderElement(el, isDark));
  });

  // PHASE 1.5: Bottom-left date (replaces "Confidential")
  var mutedColor = resolveColor('muted', isDark);
  var dateDiv = document.createElement('div');
  dateDiv.style.cssText = 'position:absolute;bottom:24px;left:40px;'
    + 'font-size:' + ptToPx(9) + 'px;'
    + 'font-weight:500;'
    + 'letter-spacing:0.15em;'
    + 'text-transform:uppercase;'
    + 'color:' + mutedColor + ';'
    + 'font-family:DM Sans,sans-serif;';
  dateDiv.textContent = getFooterDate();
  slide.appendChild(dateDiv);

  // PHASE 1.5: Bottom-right number + logo slot + divider
  if (slideData.num) {
    var footerRight = document.createElement('div');
    footerRight.style.cssText = 'position:absolute;bottom:24px;'
      + 'right:40px;display:flex;align-items:center;gap:12px;'
      + 'font-family:DM Sans,sans-serif;';

    // Logo slot (populated by applyLogoToSlides when user uploads)
    var logoSlot = document.createElement('div');
    logoSlot.className = 'logo-footer-slot';
    logoSlot.style.cssText = 'display:flex;align-items:center;';
    footerRight.appendChild(logoSlot);

    // Thin vertical divider
    var divLine = document.createElement('div');
    divLine.style.cssText = 'width:1px;height:20px;background:' + mutedColor + ';';
    footerRight.appendChild(divLine);

    // Slide number
    var numSpan = document.createElement('span');
    numSpan.style.cssText = 'font-size:' + ptToPx(10) + 'px;'
      + 'font-weight:600;color:' + mutedColor + ';';
    numSpan.textContent = slideData.num;
    footerRight.appendChild(numSpan);

    slide.appendChild(footerRight);
  }

  return slide;
}

function renderAll(D, container) {
  container.innerHTML = '';
  D.forEach(function (slideData, i) {
    var validated = validateSlide(slideData, i);
    container.appendChild(renderSlide(validated, i));
  });
}

// ============================================================
// ACCENT / COLOR MANAGEMENT
// ============================================================

function setAccent(nameOrHex, light, dark) {
  if (ACCENT_FAMILIES[nameOrHex]) {
    var fam      = ACCENT_FAMILIES[nameOrHex];
    _accentLight = fam.light;
    _accentMid   = fam.mid;
    _accentDark  = fam.dark;
    _familyName  = nameOrHex;
  } else if (nameOrHex && nameOrHex.charAt(0) === '#') {
    _accentMid   = nameOrHex;
    _accentLight = light || adjustBrightness(nameOrHex, 60);
    _accentDark  = dark  || adjustBrightness(nameOrHex, -40);
    _familyName  = 'custom';
  }
}

function adjustBrightness(hex, amount) {
  hex = hex.replace('#', '');
  var r = Math.min(255, Math.max(0, parseInt(hex.substr(0, 2), 16) + amount));
  var g = Math.min(255, Math.max(0, parseInt(hex.substr(2, 2), 16) + amount));
  var b = Math.min(255, Math.max(0, parseInt(hex.substr(4, 2), 16) + amount));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// ============================================================
// PPTX EXPORT -- SAFE AREA
// ============================================================

var pptxSafeArea = {
  x: SD_CONST.SAFE_X_MIN,
  y: SD_CONST.SAFE_Y_MIN,
  w: SD_CONST.SAFE_W,
  h: SD_CONST.CONTENT_END - SD_CONST.SAFE_Y_MIN
};

// ============================================================
// PUBLIC API
// ============================================================

window.StandardDeck = {
  renderAll:        renderAll,
  renderSlide:      renderSlide,
  renderElement:    renderElement,
  resolveColor:     resolveColor,
  colorForPptx:     colorForPptx,
  setAccent:        setAccent,
  validateSlide:    validateSlide,
  validatePosition: validatePosition,
  enforceWidthRule: enforceWidthRule,
  getTitleMetrics:  getTitleMetrics,
  getFooterDate:    getFooterDate,
  toX: toX, toY: toY, ptToPx: ptToPx,
  PALETTE:          PALETTE,
  ACCENT_FAMILIES:  ACCENT_FAMILIES,
  FONT_MAP:         FONT_MAP,
  LIMITS:           LIMITS,
  MIN_SIZES:        MIN_SIZES,
  SAFE:             SAFE,
  SD_CONST:         SD_CONST,
  SLIDE_W:          SLIDE_W,
  SLIDE_H:          SLIDE_H,
  pptxSafeArea:     pptxSafeArea,
  getAccent:        function () {
    return {
      light: _accentLight, mid: _accentMid,
      dark: _accentDark, name: _familyName
    };
  }
};

})();
