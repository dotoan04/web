import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

const WORD_MAIN = 'word/document.xml';
const WORD_FOOTNOTES = 'word/footnotes.xml';
const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
};

const BLACK_VALUES = new Set(['000000', 'auto']);

function getColorValue(run) {
  const colorNode = run.getElementsByTagNameNS(NS.w, 'color')[0];
  if (!colorNode) return null;
  const val =
    colorNode.getAttributeNS(NS.w, 'val') ||
    colorNode.getAttribute('w:val') ||
    colorNode.getAttribute('val');
  return val ? val.toLowerCase() : null;
}

function extractParagraphs(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const paragraphs = [...doc.getElementsByTagNameNS(NS.w, 'p')];
  const entries = [];

  paragraphs.forEach((paragraph) => {
    let buffer = '';
    let isColored = false;
    let currentNumId = null;
    let currentIlvl = null;

    const pPr = [...paragraph.childNodes].find(
      (node) => node.nodeType === Node.ELEMENT_NODE && node.localName === 'pPr',
    );
    if (pPr) {
      const numPr = [...pPr.childNodes].find(
        (node) => node.nodeType === Node.ELEMENT_NODE && node.localName === 'numPr',
      );
      if (numPr) {
        const numIdNode = [...numPr.childNodes].find(
          (node) => node.nodeType === Node.ELEMENT_NODE && node.localName === 'numId',
        );
        const ilvlNode = [...numPr.childNodes].find(
          (node) => node.nodeType === Node.ELEMENT_NODE && node.localName === 'ilvl',
        );
        if (numIdNode) {
          currentNumId =
            numIdNode.getAttributeNS(NS.w, 'val') ||
            numIdNode.getAttribute('w:val') ||
            numIdNode.getAttribute('val');
        }
        if (ilvlNode) {
          currentIlvl =
            ilvlNode.getAttributeNS(NS.w, 'val') ||
            ilvlNode.getAttribute('w:val') ||
            ilvlNode.getAttribute('val');
        }
      }
    }

    const flush = () => {
      const text = buffer.replace(/\u00A0/g, ' ').trim();
      if (text) {
        entries.push({ text, isColored, numId: currentNumId, ilvl: currentIlvl });
      }
      buffer = '';
      isColored = false;
    };

    [...paragraph.childNodes].forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.localName === 'r') {
        const run = node;
        const textNodes = [...run.getElementsByTagNameNS(NS.w, 't')];
        textNodes.forEach((child, index) => {
          const value = child.textContent || '';
          if (value) {
            buffer += value;
          }
          const hasTrailingBreak =
            index === textNodes.length - 1 &&
            (run.getElementsByTagNameNS(NS.w, 'br').length > 0 ||
              run.getElementsByTagNameNS(NS.w, 'cr').length > 0);
          if (hasTrailingBreak) {
            flush();
          }
        });

        const colorValue = getColorValue(run);
        if (colorValue && !BLACK_VALUES.has(colorValue)) {
          isColored = true;
        }
      } else if (node.localName === 'br' || node.localName === 'cr') {
        flush();
      }
    });

    flush();
  });

  return entries;
}

async function parseDocxFile(file) {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  if (!zip.files[WORD_MAIN]) {
    throw new Error('Tệp DOCX không hợp lệ.');
  }

  const mainXml = await zip.files[WORD_MAIN].async('string');
  let paragraphs = extractParagraphs(mainXml);

  if (zip.files[WORD_FOOTNOTES]) {
    const footXml = await zip.files[WORD_FOOTNOTES].async('string');
    paragraphs = paragraphs.concat(extractParagraphs(footXml));
  }

  return paragraphs;
}

function parsePlainText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      text: line,
      isColored: false,
      numId: null,
      ilvl: null,
    }));
}

function groupQuestions(lines) {
  const items = [];
  let current = null;

  const questionPattern = /^(Câu\s+\d+\s*[:\.\-]?)(.*)$/i;
  const answerPattern = /^([A-DĐ])[\.\)]\s*(.*)$/i;
  const labelPattern = /^(Chọn\s*\d+\s*(?:đáp\s*án|phương\s*án)\s*đúng)/i;
  const multiPattern = /(Chọn\s*\d+\s*đáp\s*án\s*đúng|Chọn\s*\d+\s*phương\s*án)/i;

  for (const entry of lines) {
    const line = entry.text;
    const trimmed = line.trim();
    const colored = Boolean(entry.isColored);

    const questionMatch = trimmed.match(questionPattern);
    if (questionMatch) {
      if (current) {
        items.push(current);
      }
      const [, prefix, rest] = questionMatch;
      const trimmed = rest.trim();
      current = {
        id: `q-${items.length + 1}`,
        raw: line,
        title: trimmed || prefix.trim(),
        options: [],
        correct: new Set(),
        multi: multiPattern.test(line),
        listId: null,
        listLevel: null,
      };
      continue;
    }

    const optionMatch = trimmed.match(answerPattern);
    if (optionMatch && current) {
      const key = optionMatch[1].trim();
      const value = optionMatch[2].trim();
      current.options.push({ key, value, isCorrect: colored });
      current.listId = null;
      current.listLevel = null;
      continue;
    }

    if (current && entry.numId) {
      if (!current.listId && current.options.length === 0) {
        current.listId = entry.numId;
        current.listLevel = entry.ilvl;
      }
      if (current.listId && current.listId === entry.numId) {
        const key = String.fromCharCode(65 + current.options.length);
        current.options.push({ key, value: trimmed, isCorrect: colored });
        continue;
      }
    }

    if (current) {
      if (labelPattern.test(trimmed)) {
        current.multi = true;
        continue;
      }
      if (current.options.length === 0) {
        current.title += ` ${trimmed}`;
      } else {
        const last = current.options[current.options.length - 1];
        last.value += ` ${trimmed}`;
        if (colored) {
          last.isCorrect = true;
        }
      }
    }
  }

  if (current) {
    items.push(current);
  }

  const filtered = items.filter((item) => item.options.length >= 2);

  filtered.forEach((item) => {
    item.correct = item.correct || new Set();
    item.options.forEach((option, index) => {
      if (option.isCorrect) {
        item.correct.add(index);
      }
    });
    if (item.correct.size > 1) {
      item.multi = true;
    }
  });

  return filtered;
}

export async function extractQuestions({ file, text }) {
  let lines = [];
  if (file) {
    try {
      lines = await parseDocxFile(file);
    } catch (error) {
      console.error(error);
      throw new Error('Không đọc được cấu trúc DOCX.');
    }
  }

  if ((!lines || lines.length === 0) && text) {
    lines = parsePlainText(text);
  }

  if (!lines || lines.length === 0) {
    throw new Error('Không tìm thấy nội dung để phân tích.');
  }

  return groupQuestions(lines);
}
