const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = path.join(process.cwd(), 'docs', 'diagrams');

const COLORS = {
  white: [255, 255, 255],
  ink: [28, 36, 48],
  muted: [96, 108, 124],
  border: [56, 71, 89],
  panel: [239, 244, 248],
  accent: [182, 110, 72],
  accentSoft: [244, 232, 223],
  note: [255, 246, 210],
  success: [214, 238, 223],
  line: [111, 126, 145],
};

const FONT = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '/': ['00001', '00010', '00100', '01000', '10000', '00000', '00000'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '10001', '11001', '10101', '10011', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
};

function sanitizeText(text) {
  return text.toUpperCase().replace(/[^A-Z0-9 .:\/-]/g, '?');
}

function createCanvas(width, height, color) {
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i += 1) {
    pixels[i * 3] = color[0];
    pixels[i * 3 + 1] = color[1];
    pixels[i * 3 + 2] = color[2];
  }
  return { width, height, pixels };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return;
  }
  const index = (y * canvas.width + x) * 3;
  canvas.pixels[index] = color[0];
  canvas.pixels[index + 1] = color[1];
  canvas.pixels[index + 2] = color[2];
}

function fillRect(canvas, x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPixel(canvas, xx, yy, color);
    }
  }
}

function strokeRect(canvas, x, y, width, height, color, stroke = 2) {
  fillRect(canvas, x, y, width, stroke, color);
  fillRect(canvas, x, y + height - stroke, width, stroke, color);
  fillRect(canvas, x, y, stroke, height, color);
  fillRect(canvas, x + width - stroke, y, stroke, height, color);
}

function drawLine(canvas, x1, y1, x2, y2, color, thickness = 2) {
  const dx = Math.abs(x2 - x1);
  const sx = x1 < x2 ? 1 : -1;
  const dy = -Math.abs(y2 - y1);
  const sy = y1 < y2 ? 1 : -1;
  let err = dx + dy;
  let currentX = x1;
  let currentY = y1;

  while (true) {
    fillRect(
      canvas,
      currentX - Math.floor(thickness / 2),
      currentY - Math.floor(thickness / 2),
      thickness,
      thickness,
      color,
    );
    if (currentX === x2 && currentY === y2) {
      break;
    }
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      currentX += sx;
    }
    if (e2 <= dx) {
      err += dx;
      currentY += sy;
    }
  }
}

function drawDashedVertical(canvas, x, y1, y2, color) {
  const dash = 12;
  const gap = 10;
  for (let y = y1; y < y2; y += dash + gap) {
    fillRect(canvas, x - 1, y, 2, Math.min(dash, y2 - y), color);
  }
}

function drawArrow(canvas, x1, y1, x2, y2, color, dashed = false) {
  if (dashed) {
    const length = Math.max(Math.abs(x2 - x1), 1);
    const segments = Math.max(Math.floor(length / 22), 1);
    for (let i = 0; i < segments; i += 1) {
      const startRatio = i / segments;
      const endRatio = Math.min((i + 0.55) / segments, 1);
      const sx = Math.round(x1 + (x2 - x1) * startRatio);
      const sy = Math.round(y1 + (y2 - y1) * startRatio);
      const ex = Math.round(x1 + (x2 - x1) * endRatio);
      const ey = Math.round(y1 + (y2 - y1) * endRatio);
      drawLine(canvas, sx, sy, ex, ey, color, 2);
    }
  } else {
    drawLine(canvas, x1, y1, x2, y2, color, 2);
  }

  const direction = x2 >= x1 ? 1 : -1;
  drawLine(canvas, x2, y2, x2 - direction * 14, y2 - 7, color, 2);
  drawLine(canvas, x2, y2, x2 - direction * 14, y2 + 7, color, 2);
}

function charWidth(scale) {
  return 5 * scale;
}

function textWidth(text, scale) {
  return sanitizeText(text).length * (charWidth(scale) + scale);
}

function drawText(canvas, x, y, text, color, scale = 2) {
  const safeText = sanitizeText(text);
  let cursor = x;
  for (const char of safeText) {
    const glyph = FONT[char] || FONT['?'];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === '1') {
          fillRect(
            canvas,
            cursor + col * scale,
            y + row * scale,
            scale,
            scale,
            color,
          );
        }
      }
    }
    cursor += charWidth(scale) + scale;
  }
}

function wrapText(text, maxWidth, scale) {
  const words = sanitizeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, scale) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [''];
}

function drawWrappedText(canvas, x, y, maxWidth, text, color, scale = 2, lineGap = 6) {
  const lines = wrapText(text, maxWidth, scale);
  const lineHeight = 7 * scale + lineGap;
  lines.forEach((line, index) => {
    drawText(canvas, x, y + index * lineHeight, line, color, scale);
  });
  return lines.length * lineHeight - lineGap;
}

function drawCenteredWrappedText(canvas, centerX, y, boxWidth, text, color, scale = 2) {
  const lines = wrapText(text, boxWidth - 18, scale);
  const lineHeight = 7 * scale + 6;
  lines.forEach((line, index) => {
    const width = textWidth(line, scale);
    drawText(canvas, Math.round(centerX - width / 2), y + index * lineHeight, line, color, scale);
  });
  return lines.length * lineHeight - 6;
}

function writePpm(canvas, filePath) {
  const header = Buffer.from(`P6\n${canvas.width} ${canvas.height}\n255\n`);
  fs.writeFileSync(filePath, Buffer.concat([header, canvas.pixels]));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildDiagram(config) {
  const actorBoxWidth = 180;
  const actorBoxHeight = 84;
  const leftPad = 90;
  const rightPad = 90;
  const topPad = 60;
  const titleHeight = 56;
  const subtitleHeight = 40;
  const actorGap = 220;
  const eventGap = 96;
  const footerPad = 70;
  const actors = config.participants.map((label, index) => ({
    label,
    x: leftPad + actorBoxWidth / 2 + index * actorGap,
  }));
  const width = leftPad + rightPad + actorBoxWidth + (actors.length - 1) * actorGap;
  const height =
    topPad +
    titleHeight +
    subtitleHeight +
    actorBoxHeight +
    40 +
    config.events.length * eventGap +
    footerPad;
  const canvas = createCanvas(width, height, COLORS.white);

  drawText(canvas, leftPad, 28, config.title, COLORS.ink, 3);
  drawText(canvas, leftPad, 74, config.subtitle, COLORS.muted, 2);

  const actorY = topPad + titleHeight + subtitleHeight;
  const lifelineTop = actorY + actorBoxHeight;
  const lifelineBottom = height - footerPad + 10;

  actors.forEach((actor) => {
    fillRect(
      canvas,
      Math.round(actor.x - actorBoxWidth / 2),
      actorY,
      actorBoxWidth,
      actorBoxHeight,
      COLORS.panel,
    );
    strokeRect(
      canvas,
      Math.round(actor.x - actorBoxWidth / 2),
      actorY,
      actorBoxWidth,
      actorBoxHeight,
      COLORS.border,
      2,
    );
    drawCenteredWrappedText(canvas, actor.x, actorY + 18, actorBoxWidth, actor.label, COLORS.ink, 2);
    drawDashedVertical(canvas, Math.round(actor.x), lifelineTop, lifelineBottom, COLORS.line);
  });

  config.events.forEach((event, index) => {
    const y = lifelineTop + 42 + index * eventGap;

    if (event.type === 'note') {
      const from = actors[event.from];
      const to = actors[event.to];
      const minX = Math.min(from.x, to.x) - 70;
      const maxX = Math.max(from.x, to.x) + 70;
      const boxX = Math.round(minX);
      const boxWidth = Math.round(maxX - minX);
      const boxY = y - 24;
      const boxHeight = 66;
      fillRect(canvas, boxX, boxY, boxWidth, boxHeight, COLORS.note);
      strokeRect(canvas, boxX, boxY, boxWidth, boxHeight, COLORS.accent, 2);
      drawWrappedText(canvas, boxX + 16, boxY + 16, boxWidth - 32, event.label, COLORS.ink, 2);
      return;
    }

    const from = actors[event.from];
    const to = actors[event.to];
    const startX = Math.round(from.x);
    const endX = Math.round(to.x);
    drawArrow(canvas, startX, y, endX, y, COLORS.border, event.type === 'return');
    const labelWidth = Math.min(Math.abs(endX - startX) - 28, 340);
    const labelX = Math.round(Math.min(startX, endX) + 14);
    drawWrappedText(
      canvas,
      labelX,
      y - 34,
      Math.max(labelWidth, 180),
      event.label,
      event.type === 'return' ? COLORS.muted : COLORS.ink,
      2,
    );
  });

  return canvas;
}

function renderDiagram(fileName, config) {
  const ppmPath = path.join(OUT_DIR, `${fileName}.ppm`);
  const pngPath = path.join(OUT_DIR, `${fileName}.png`);
  const canvas = buildDiagram(config);
  writePpm(canvas, ppmPath);
  execFileSync('/usr/bin/sips', ['-s', 'format', 'png', ppmPath, '--out', pngPath], {
    stdio: 'ignore',
  });
  fs.unlinkSync(ppmPath);
  return pngPath;
}

ensureDir(OUT_DIR);

const diagrams = [
  {
    fileName: 'ai-chat-add-expense',
    config: {
      title: 'ADD EXPENSE FLOW',
      subtitle: 'USER MESSAGE I SPENT 450 ON ZOMATO USING HDFC CREDIT CARD ON DATE 8 APRIL 2026',
      participants: [
        'USER',
        'CHAT PANEL',
        'APP DATA',
        'CHAT API',
        'CHAT ROUTE',
        'ASSISTANT',
        'DATA STORE',
        'GEMINI',
      ],
      events: [
        { type: 'call', from: 0, to: 1, label: 'SEND MESSAGE' },
        { type: 'call', from: 1, to: 2, label: 'HANDLE SEND' },
        { type: 'call', from: 2, to: 3, label: 'POST CHAT MESSAGE' },
        { type: 'call', from: 3, to: 4, label: 'VALIDATE PAYLOAD' },
        { type: 'call', from: 4, to: 5, label: 'HANDLE ASSISTANT MESSAGE' },
        { type: 'call', from: 5, to: 6, label: 'LOAD CATEGORIES AND PAYMENT METHODS' },
        { type: 'return', from: 6, to: 5, label: 'USER CONTEXT' },
        { type: 'call', from: 5, to: 7, label: 'EXTRACT INTENT AS JSON' },
        { type: 'return', from: 7, to: 5, label: 'ADD EXPENSE INTENT WITH AMOUNT MERCHANT CARD DATE' },
        { type: 'note', from: 5, to: 7, label: 'IF GEMINI IS UNAVAILABLE THE SERVER USES FALLBACK INTENT HEURISTICS' },
        { type: 'call', from: 5, to: 6, label: 'LOAD BUDGETS AND SETTINGS' },
        { type: 'return', from: 6, to: 5, label: 'BUDGETS AND SETTINGS' },
        { type: 'call', from: 5, to: 6, label: 'CREATE EXPENSE' },
        { type: 'return', from: 6, to: 5, label: 'SAVED EXPENSE' },
        { type: 'return', from: 5, to: 4, label: 'RESPONSE PAYLOAD' },
        { type: 'return', from: 4, to: 3, label: 'JSON RESPONSE' },
        { type: 'return', from: 3, to: 2, label: 'CHAT RESPONSE' },
        { type: 'call', from: 2, to: 1, label: 'RENDER TEXT AND EXPENSE CARD' },
      ],
    },
  },
  {
    fileName: 'ai-chat-groceries-total',
    config: {
      title: 'SINGLE CATEGORY SUMMARY FLOW',
      subtitle: 'USER MESSAGE PROVIDE TOTAL SPENT ON GROCERIES CATEGORY THIS MONTH',
      participants: [
        'USER',
        'CHAT PANEL',
        'APP DATA',
        'CHAT API',
        'CHAT ROUTE',
        'ASSISTANT',
        'DATA STORE',
        'GEMINI',
      ],
      events: [
        { type: 'call', from: 0, to: 1, label: 'SEND MESSAGE' },
        { type: 'call', from: 1, to: 2, label: 'HANDLE SEND' },
        { type: 'call', from: 2, to: 3, label: 'POST CHAT MESSAGE' },
        { type: 'call', from: 3, to: 4, label: 'VALIDATE PAYLOAD' },
        { type: 'call', from: 4, to: 5, label: 'HANDLE ASSISTANT MESSAGE' },
        { type: 'call', from: 5, to: 6, label: 'LOAD CATEGORIES PAYMENT METHODS BUDGETS SETTINGS' },
        { type: 'return', from: 6, to: 5, label: 'USER CONTEXT' },
        { type: 'call', from: 5, to: 7, label: 'EXTRACT INTENT AS JSON' },
        { type: 'return', from: 7, to: 5, label: 'GET EXPENSES INTENT WITH GROCERIES FILTER' },
        { type: 'note', from: 5, to: 7, label: 'THIS EXAMPLE USES ONE CATEGORY BECAUSE THE CURRENT SCHEMA DOES NOT SUPPORT CATEGORY ARRAYS' },
        { type: 'call', from: 5, to: 6, label: 'LIST EXPENSES FOR CATEGORY AND DATE RANGE' },
        { type: 'return', from: 6, to: 5, label: 'MATCHING EXPENSES' },
        { type: 'note', from: 5, to: 5, label: 'ASSISTANT BUILDS BUDGET ALERTS TOTALS AND SUMMARY STATS' },
        { type: 'call', from: 5, to: 7, label: 'GENERATE FINAL NATURAL RESPONSE' },
        { type: 'return', from: 7, to: 5, label: 'SUMMARY TEXT' },
        { type: 'note', from: 5, to: 7, label: 'IF GEMINI IS UNAVAILABLE THE SERVER FALLS BACK TO A DETERMINISTIC SUMMARY STRING' },
        { type: 'return', from: 5, to: 4, label: 'RESPONSE WITH MATCHES AND ALERTS' },
        { type: 'return', from: 4, to: 3, label: 'JSON RESPONSE' },
        { type: 'return', from: 3, to: 2, label: 'CHAT RESPONSE' },
        { type: 'call', from: 2, to: 1, label: 'RENDER TEXT TOTAL AND MATCH CARDS' },
      ],
    },
  },
];

for (const diagram of diagrams) {
  const outputPath = renderDiagram(diagram.fileName, diagram.config);
  process.stdout.write(`${path.relative(process.cwd(), outputPath)}\n`);
}
